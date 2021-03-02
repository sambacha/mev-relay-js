// A simple server that proxies only specific methods to an Ethereum JSON-RPC
//   FIXME: Cannot redeclare block-scoped variable 'express'.
const express = require('express');
//   FIXME: Cannot redeclare block-scoped variable 'bodyParser... Remove this comment to see the full error message
const bodyParser = require('body-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
//   FIXME: Cannot redeclare block-scoped variable '_'.
const _ = require('lodash');
//   FIXME: Cannot redeclare block-scoped variable 'Sentry'.
const Sentry = require('@sentry/node');
const promBundle = require('express-prom-bundle');
//   FIXME: Cannot redeclare block-scoped variable 'Users'.
const { Users, hashPass } = require('./model');
//   FIXME: Cannot redeclare block-scoped variable 'Handler'.
const { Handler } = require('./handlers');
//   FIXME: Cannot redeclare block-scoped variable 'writeError... Remove this comment to see the full error message
const { writeError } = require('./utils');

if (process.env.SENTRY_DSN) {
  console.log('initializing sentry');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

//   FIXME: Cannot redeclare block-scoped variable 'ALLOWED_ME... Remove this comment to see the full error message
const ALLOWED_METHODS = ['eth_sendBundle', 'eth_callBundle'];

function help() {
  console.log('node ./server/main.js minerUrls simulationRpc sqsUrl [PORT]');
}

function validPort(port: any) {
  if (isNaN(port) || port < 0 || port > 65535) {
    return false;
  }

  return true;
}

if (_.includes(process.argv, '-h') || _.includes(process.argv, '--help')) {
  help();
  process.exit(0);
}

const MINERS = _.split(process.argv[2], ',');
if (MINERS.length === 0) {
  console.error('no valid miner urls provided');
  help();
  process.exit(1);
}

const SIMULATION_RPC = process.argv[3];
if (!SIMULATION_RPC) {
  console.error('invalid simulation rpc provided');
  help();
  process.exit(1);
}

const SQS_URL = process.argv[4];
if (!SIMULATION_RPC) {
  console.error('invalid simulation rpc provided');
  help();
  process.exit(1);
}

const PORT = parseInt(_.get(process.argv, '[5]', '18545'));

if (!validPort(PORT)) {
  console.error(`invalid port specified for PORT: ${PORT}`);
  process.exit(1);
}

//   FIXME: Cannot redeclare block-scoped variable 'app'.
const app = express();
app.set('trust proxy', true);
const metricsRequestMiddleware = promBundle({
  includePath: true,
  includeMethod: true,
  autoregister: false, // Do not register /metrics
  promClient: {
    collectDefaultMetrics: {},
  },
});
const { promClient, metricsMiddleware } = metricsRequestMiddleware;

// Metrics app to expose /metrics endpoint
const metricsApp = express();
metricsApp.use(metricsMiddleware);

app.use(metricsRequestMiddleware);
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(async (req: any, res: any, next: any) => {
  const auth = req.header('Authorization');
  if (!auth) {
    writeError(res, 403, 'missing Authorization header');
    return;
  }
  if (!req.body) {
    writeError(res, 400, 'invalid json body');
    return;
  }
  if (!req.body.method) {
    writeError(res, 400, 'missing method');
    return;
  }
  if (!_.includes(ALLOWED_METHODS, req.body.method)) {
    writeError(
      res,
      400,
      `invalid method, only ${ALLOWED_METHODS} supported, you provided: ${req.body.method}`,
    );
    return;
  }
  next();
});
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15,
    keyGenerator: (req: any) => {
      return `${req.body.method}-${req.header('Authorization')}`;
    },
    onLimitReached: (req: any) => {
      let auth = req.header('Authorization');
      if (_.startsWith(auth, 'Bearer ')) {
        auth = auth.slice(7);
      }
      auth = auth.slice(0, 8);

      console.log(`rate limit reached for auth: ${auth} ${req.body.method} ${req.ip}`);
    },
  }),
);
const UNIQUE_USER_COUNT = {};

const bundleCounterPerUser = new promClient.Counter({
  name: 'relay_bundles_per_user',
  help: '# of bundles received per user',
  labelNames: ['username'],
});
// eslint-disable-next-line no-unused-vars
const uniqueUserGauge = new promClient.Gauge({
  name: 'relay_unique_user',
  help: 'unique user keys in relay',
  collect() {
    this.set(Object.keys(UNIQUE_USER_COUNT).length);
  },
});

app.use(async (req: any, res: any, next: any) => {
  try {
    let auth = req.header('Authorization');
    if (_.startsWith(auth, 'Bearer ')) {
      auth = auth.slice(7);
    }

    auth = _.split(auth, ':');
    if (auth.length !== 2) {
      writeError(res, 403, 'invalid Authorization token');
      return;
    }

    const keyID = auth[0];
    const secretKey = auth[1];

    const users = await Users.query('keyID').eq(keyID).exec();
    const user = users[0];

    if (!user) {
      writeError(res, 403, 'invalid Authorization token');
      return;
    }
    if ((await hashPass(secretKey, user.salt)) !== user.hashedSecretKey) {
      writeError(res, 403, 'invalid Authorization token');
      return;
    }
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    let count = UNIQUE_USER_COUNT[keyID];
    if (!count) {
      count = 0;
    }
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    UNIQUE_USER_COUNT[keyID] = count + 1;
    bundleCounterPerUser.inc({ username: keyID.slice(0, 8) });

    req.user = { keyID };
    next();
  } catch (error) {
    Sentry.captureException(error);
    console.error('error in auth middleware', error);
    try {
      writeError(res, 403, 'internal server error');
    } catch (error2) {
      Sentry.captureException(error2);
      console.error(`error in error response: ${error2}`);
    }
  }
});
// the 2nd rate limit will match all requests that get through the above
// middleware, so this becomes a global rate limit that only applies to valid
// requests
app.use(
  rateLimit({
    windowMs: 15 * 1000,
    max: 60,
    keyGenerator: () => {
      return '';
    },
    onLimitReached: (req: any) => {
      console.log('rate limit reached for global');
    },
  }),
);

const handler = new Handler(MINERS, SIMULATION_RPC, SQS_URL, promClient);

app.use(async (req: any, res: any) => {
  try {
    console.log(`request body: ${JSON.stringify(req.body)}`);

    if (req.body.method === 'eth_sendBundle') {
      await handler.handleSendBundle(req, res);
    } else if (req.body.method === 'eth_callBundle') {
      await handler.handleCallBundle(req, res);
    } else {
      const err = `unknown method: ${req.body.method}`;
      Sentry.captureException(err);
      console.error(err);
      writeError(res, 400, err);
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error(`error in handler: ${error}`);
    try {
      writeError(res, 500, 'internal server error');
    } catch (error2) {
      Sentry.captureException(error2);
      console.error(`error in error response: ${error2}`);
    }
  }
});
process.on('unhandledRejection', (err) => {
  Sentry.captureException(err);
  console.error(`unhandled rejection: ${err}`);
});

app.listen(PORT, () => {
  metricsApp.listen(9090);

  console.log(`relay listening at ${PORT}`);
});
