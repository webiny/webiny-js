"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyApi = require("webiny-api");

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _authenticationError = require("../services/authenticationError");

var _authenticationError2 = _interopRequireDefault(_authenticationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (BaseEndpoint, config, authentication) => {
    return class Auth extends BaseEndpoint {
        init(api) {
            super.init(api);

            // Create API methods for each identity
            config.identities.map(({ identity: Identity, authenticate }) => {
                // Create api methods for each strategy
                authenticate.map(({ strategy, apiMethod, expiresOn }) => {
                    api
                        .post(
                            apiMethod.name,
                            apiMethod.pattern,
                            (() => {
                                var _ref = (0, _asyncToGenerator3.default)(function*({ req }) {
                                    try {
                                        const identity = yield authentication.authenticate(
                                            req,
                                            Identity,
                                            strategy
                                        );

                                        const error = `"expiresOn" function must be configured for "${strategy}" strategy!`;
                                        (0,
                                        _invariant2.default)(typeof expiresOn === "function", error);

                                        let expiration = expiresOn(req);
                                        if (expiration instanceof Date) {
                                            expiration = Math.floor(expiration.getTime() / 1000);
                                        }

                                        return new _webinyApi.ApiResponse({
                                            token: yield authentication.createToken(
                                                identity,
                                                expiration
                                            ),
                                            identity: yield identity.toJSON(req.query._fields),
                                            expiresOn: expiration
                                        });
                                    } catch (e) {
                                        const response = new _webinyApi.ApiErrorResponse(
                                            {},
                                            e.message
                                        );
                                        if (e instanceof _authenticationError2.default) {
                                            response.errorCode = "WBY_INVALID_CREDENTIALS";
                                            response.statusCode = 401;
                                        } else {
                                            response.errorCode = "WBY_INTERNAL_ERROR";
                                            response.statusCode = 500;
                                        }
                                        return response;
                                    }
                                });

                                return function(_x) {
                                    return _ref.apply(this, arguments);
                                };
                            })()
                        )
                        .setPublic();
                });
            });
        }
    };
};
//# sourceMappingURL=generator.js.map
