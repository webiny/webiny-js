"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _authenticationError = require("../services/authenticationError");

var _authenticationError2 = _interopRequireDefault(_authenticationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class JwtToken {
    constructor(config) {
        this.config = config;
    }

    data(identity) {
        if (typeof this.config.data === "function") {
            return this.config.data(identity);
        }

        // Data to encode into a token
        return _promise2.default.resolve({
            identityId: identity.id,
            classId: identity.classId
        });
    }

    encode(identity, expiresOn) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const token = _jsonwebtoken2.default.sign(
                {
                    data: yield _this.data(identity),
                    exp: expiresOn
                },
                _this.config.secret
            );

            return _promise2.default.resolve(token);
        })();
    }

    decode(token) {
        return new _promise2.default((resolve, reject) => {
            _jsonwebtoken2.default.verify(token, this.config.secret, (err, data) => {
                if (err) {
                    if (err.name === "TokenExpiredError") {
                        reject(
                            new _authenticationError2.default(
                                err.message,
                                _authenticationError2.default.TOKEN_EXPIRED
                            )
                        );
                    } else {
                        reject(
                            new _authenticationError2.default(
                                err.message,
                                _authenticationError2.default.TOKEN_INVALID
                            )
                        );
                    }
                    return;
                }

                resolve(data);
            });
        });
    }
}

exports.default = JwtToken;
//# sourceMappingURL=jwtToken.js.map
