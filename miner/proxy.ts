// A simple server that proxies only specific methods to an Ethereum JSON-RPC
//   FIXME: Cannot redeclare block-scoped variable 'express'.
const express = require('express')
//   FIXME: Cannot redeclare block-scoped variable 'bodyParser... Remove this comment to see the full error message
const bodyParser = require('body-parser')
//   FIXME: Cannot redeclare block-scoped variable 'request'.
const request = require('request')
//   FIXME: Cannot redeclare block-scoped variable '_'.
const _ = require('lodash')

//   FIXME: Cannot redeclare block-scoped variable 'ALLOWED_ME... Remove this comment to see the full error message
const ALLOWED_METHODS = ['eth_sendBundle']

// @ts-expect-error ts-migrate(2393) FIXME: Duplicate function implementation.
function help() {
  console.log('node ./miner/proxy.js [PUBLIC_PORT] [GETH_PORT] [GETH_URL]')
}

// @ts-expect-error ts-migrate(2393) FIXME: Duplicate function implementation.
function validPort(port: any) {
  if (isNaN(port) || port < 0 || port > 65535) {
    return false
  }

  return true
}

if (_.includes(process.argv, '-h') || _.includes(process.argv, '--help')) {
  help()
  process.exit(0)
}

const PUBLIC_PORT = parseInt(_.get(process.argv, '[2]', '18545'))
const GETH_PORT = parseInt(_.get(process.argv, '[3]', '8545'))
const GETH_URL = _.get(process.argv, '[4]', 'http://localhost')

if (!validPort(PUBLIC_PORT)) {
  console.error(`invalid port specified for PUBLIC_PORT: ${PUBLIC_PORT}`)
  process.exit(1)
}
if (!validPort(GETH_PORT)) {
  console.error(`invalid port specified for GETH_PORT: ${GETH_PORT}`)
  process.exit(1)
}

//   FIXME: Cannot redeclare block-scoped variable 'app'.
const app = express()
app.use(bodyParser.json())

app.use(function (req: any, res: any) {
  if (!req.body) {
    res.writeHead(400)
    res.end('invalid json body')
    return
  }
  if (!req.body.method) {
    res.writeHead(400)
    res.end('missing method')
    return
  }
  if (!_.includes(ALLOWED_METHODS, req.body.method)) {
    res.writeHead(400)
    res.end(`invalid method, only ${ALLOWED_METHODS} supported, you provided: ${req.body.method}`)
    return
  }

  request
    .post({
      url: `${GETH_URL}:${GETH_PORT}`,
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' }
    })
    .on('error', function (e: any) {
      res.writeHead(500)
      res.end(`error in proxy: ${e}`)
    })
    .pipe(res)
})

app.listen(PUBLIC_PORT, () => {
  console.log(`proxy listening at ${PUBLIC_PORT} and forwarding to ${GETH_URL}:${GETH_PORT}`)
})
