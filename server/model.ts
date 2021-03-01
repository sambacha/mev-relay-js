const dynamoose = require('dynamoose');
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'crypto'.
const crypto = require('crypto');
const util = require('util');
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable '_'.
const _ = require('lodash');
const pbkdf2 = util.promisify((crypto as any).pbkdf2);
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'Users'.
const Users = dynamoose.model('RelayUsers', new dynamoose.Schema({
    email: String,
    keyID: { type: String, index: { global: true } },
    hashedSecretKey: { type: String, index: { global: true } },
    salt: String
}));
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'generateSa... Remove this comment to see the full error message
function generateSalt() {
    return (crypto as any).randomBytes(32).toString('base64');
}
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'generateKe... Remove this comment to see the full error message
function generateKeyID() {
    return _.trimEnd((crypto as any).randomBytes(32).toString('base64'), '=');
}
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'generateSe... Remove this comment to see the full error message
function generateSecretKey() {
    return _.trimEnd((crypto as any).randomBytes(64).toString('base64'), '=');
}
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'hashPass'.
async function hashPass(pass: any, salt: any) {
    return (await pbkdf2(pass, salt, 1000, 64, 'sha512')).toString('hex');
}
module.exports = { Users, generateSalt, generateKeyID, generateSecretKey, hashPass };
