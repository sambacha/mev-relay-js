"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'Users'.
var _a = require('../model'), Users = _a.Users, generateSalt = _a.generateSalt, generateKeyID = _a.generateKeyID, generateSecretKey = _a.generateSecretKey, hashPass = _a.hashPass;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var command, salt, secretKey, keyID, user, _a, _b, _c, users, _d, _e, _f, _g, _h, _j;
        var _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    if (process.argv.length < 3) {
                        console.log('provide more args');
                        process.exit(1);
                    }
                    command = process.argv[2];
                    if (!(command === 'create')) return [3 /*break*/, 3];
                    salt = generateSalt();
                    secretKey = generateSecretKey();
                    keyID = generateKeyID();
                    _a = Users.bind;
                    _k = {
                        email: process.argv[3],
                        keyID: keyID
                    };
                    return [4 /*yield*/, hashPass(secretKey, salt)];
                case 1:
                    user = new (_a.apply(Users, [void 0, (_k.hashedSecretKey = _l.sent(),
                            _k.salt = salt,
                            _k)]))();
                    return [4 /*yield*/, user.save()];
                case 2:
                    _l.sent();
                    console.log("FLASHBOTS_KEY_ID=" + keyID);
                    console.log("FLASHBOTS_SECRET=" + secretKey);
                    return [3 /*break*/, 14];
                case 3:
                    if (!(command === 'scan')) return [3 /*break*/, 5];
                    _c = (_b = console).log;
                    return [4 /*yield*/, Users.scan().all().exec()];
                case 4:
                    _c.apply(_b, [(_l.sent()).toJSON()]);
                    return [3 /*break*/, 14];
                case 5:
                    if (!(command === 'dump')) return [3 /*break*/, 7];
                    return [4 /*yield*/, Users.scan().all().exec()];
                case 6:
                    users = _l.sent();
                    console.log('email,shortKey');
                    users.forEach(function (element) {
                        console.log(element.email + "," + element.keyID.slice(0, 8));
                    });
                    return [3 /*break*/, 14];
                case 7:
                    if (!(command === 'getByEmail')) return [3 /*break*/, 9];
                    _e = (_d = console).log;
                    return [4 /*yield*/, Users.query('email').eq(process.argv[3]).exec()];
                case 8:
                    _e.apply(_d, [_l.sent()]);
                    return [3 /*break*/, 14];
                case 9:
                    if (!(command === 'getByKeyID')) return [3 /*break*/, 11];
                    _g = (_f = console).log;
                    return [4 /*yield*/, Users.query('keyID').eq(process.argv[3]).exec()];
                case 10:
                    _g.apply(_f, [_l.sent()]);
                    return [3 /*break*/, 14];
                case 11:
                    if (!(command === 'getByShortKeyID')) return [3 /*break*/, 13];
                    _j = (_h = console).log;
                    return [4 /*yield*/, Users.scan('keyID').beginsWith(process.argv[3]).exec()];
                case 12:
                    _j.apply(_h, [_l.sent()]);
                    return [3 /*break*/, 14];
                case 13:
                    console.error('unknown command');
                    process.exit(1);
                    _l.label = 14;
                case 14: return [2 /*return*/];
            }
        });
    });
}
main();
