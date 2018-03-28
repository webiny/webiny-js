"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _AuthenticationError = require("./AuthenticationError");

var _AuthenticationError2 = _interopRequireDefault(_AuthenticationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var debug = (0, _debug2.default)("webiny-app-security");

function getToken() {
    return _jsCookie2.default.get(this.config.cookie);
}

var Authentication = (function() {
    function Authentication(config) {
        var _this = this;

        (0, _classCallCheck3.default)(this, Authentication);

        var defaultConfig = {
            header: "Authorization",
            cookie: "webiny-token",
            url: "/security/auth/me",
            fields:
                "id,email,firstName,lastName,roles.slug,roleGroups[id,name,roles.slug],gravatar",
            me: function me() {
                return _axios2.default.create({
                    method: "get",
                    url: _this.config.url,
                    params: { _fields: _this.config.fields }
                });
            },
            onLogout: function onLogout() {
                // Override to do something
            }
        };
        this.config = Object.assign({}, defaultConfig, config);
        this.callbacks = {
            onIdentity: [
                function(identity) {
                    if (identity) {
                        _axios2.default.defaults.headers[_this.config.header] = getToken.call(
                            _this
                        );
                    } else {
                        delete _axios2.default.defaults.headers[_this.config.header];
                    }
                }
            ]
        };
    }

    (0, _createClass3.default)(Authentication, [
        {
            key: "login",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(
                        identity,
                        strategy,
                        payload
                    ) {
                        var identityConfig,
                            strategyConfig,
                            response,
                            _response$data,
                            message,
                            code,
                            data,
                            expires;

                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            _context.prev = 0;
                                            identityConfig = (0, _find3.default)(
                                                this.config.identities,
                                                { identity: identity }
                                            );

                                            (0, _invariant2.default)(
                                                identityConfig,
                                                'Identity "' +
                                                    identity +
                                                    '" not found in authentication service!'
                                            );

                                            strategyConfig = (0, _find3.default)(
                                                identityConfig.authenticate,
                                                { strategy: strategy }
                                            );

                                            (0, _invariant2.default)(
                                                strategyConfig,
                                                'Strategy "' +
                                                    strategy +
                                                    '" not found in authentication service!'
                                            );

                                            // Attempt to login
                                            _context.next = 7;
                                            return _axios2.default.post(
                                                strategyConfig.apiMethod,
                                                payload
                                            );

                                        case 7:
                                            response = _context.sent;
                                            (_response$data = response.data),
                                                (message = _response$data.message),
                                                (code = _response$data.code),
                                                (data = _response$data.data);

                                            if (!code) {
                                                _context.next = 11;
                                                break;
                                            }

                                            return _context.abrupt(
                                                "return",
                                                Promise.reject(
                                                    new _AuthenticationError2.default(
                                                        message,
                                                        code,
                                                        { response: response }
                                                    )
                                                )
                                            );

                                        case 11:
                                            if (data.token) {
                                                _context.next = 13;
                                                break;
                                            }

                                            return _context.abrupt("return", Promise.resolve(data));

                                        case 13:
                                            // Set token cookie
                                            expires = new Date(data.expiresOn * 1000);

                                            _jsCookie2.default.set(this.config.cookie, data.token, {
                                                path: "/",
                                                expires: expires
                                            });

                                            _context.next = 17;
                                            return this.authenticate();

                                        case 17:
                                            return _context.abrupt(
                                                "return",
                                                Promise.resolve({
                                                    token: data.token,
                                                    identity: this.identity
                                                })
                                            );

                                        case 20:
                                            _context.prev = 20;
                                            _context.t0 = _context["catch"](0);
                                            return _context.abrupt(
                                                "return",
                                                Promise.reject(_context.t0)
                                            );

                                        case 23:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this,
                            [[0, 20]]
                        );
                    })
                );

                function login(_x, _x2, _x3) {
                    return _ref.apply(this, arguments);
                }

                return login;
            })()

            /**
             * Authenticate user (if possible).
             * @returns {Promise<Object>} Identity data.
             */
        },
        {
            key: "authenticate",
            value: (function() {
                var _ref2 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee2() {
                        var _this2 = this;

                        var token, _ref3, _ref3$data, code, message, data, _identity, id, email;

                        return _regenerator2.default.wrap(
                            function _callee2$(_context2) {
                                while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                        case 0:
                                            if (!this.identity) {
                                                _context2.next = 2;
                                                break;
                                            }

                                            return _context2.abrupt(
                                                "return",
                                                Promise.resolve(this.identity)
                                            );

                                        case 2:
                                            token = getToken.call(this);

                                            if (token) {
                                                _context2.next = 5;
                                                break;
                                            }

                                            return _context2.abrupt(
                                                "return",
                                                Promise.reject(
                                                    new _AuthenticationError2.default(
                                                        "Identity token is not set!",
                                                        "TOKEN_NOT_SET"
                                                    )
                                                )
                                            );

                                        case 5:
                                            _context2.next = 7;
                                            return this.config.me().request({
                                                headers: (0, _defineProperty3.default)(
                                                    {},
                                                    this.config.header,
                                                    token
                                                )
                                            });

                                        case 7:
                                            _ref3 = _context2.sent;
                                            _ref3$data = _ref3.data;
                                            code = _ref3$data.code;
                                            message = _ref3$data.message;
                                            data = _ref3$data.data;

                                            if (!code) {
                                                _context2.next = 14;
                                                break;
                                            }

                                            return _context2.abrupt(
                                                "return",
                                                Promise.reject(
                                                    new _AuthenticationError2.default(
                                                        message,
                                                        code,
                                                        data
                                                    )
                                                )
                                            );

                                        case 14:
                                            this.identity = data;
                                            (_identity = this.identity),
                                                (id = _identity.id),
                                                (email = _identity.email);

                                            debug("Loaded user %o with id %o", email, id);
                                            this.callbacks.onIdentity.map(function(cb) {
                                                return cb(_this2.identity);
                                            });

                                            return _context2.abrupt(
                                                "return",
                                                Promise.resolve(this.identity)
                                            );

                                        case 19:
                                        case "end":
                                            return _context2.stop();
                                    }
                                }
                            },
                            _callee2,
                            this
                        );
                    })
                );

                function authenticate() {
                    return _ref2.apply(this, arguments);
                }

                return authenticate;
            })()

            /**
             * Refresh user data by fetching fresh data via API.
             *
             * @returns {Promise<Object>}
             */
        },
        {
            key: "refresh",
            value: function refresh() {
                this.identity = null;
                return this.authenticate();
            }
        },
        {
            key: "logout",
            value: (function() {
                var _ref4 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee3() {
                        return _regenerator2.default.wrap(
                            function _callee3$(_context3) {
                                while (1) {
                                    switch ((_context3.prev = _context3.next)) {
                                        case 0:
                                            this.identity = null;
                                            _jsCookie2.default.remove(this.config.cookie, {
                                                path: "/"
                                            });
                                            this.callbacks.onIdentity.map(function(cb) {
                                                return cb(null);
                                            });
                                            _context3.next = 5;
                                            return this.config.onLogout();

                                        case 5:
                                            return _context3.abrupt("return", Promise.resolve());

                                        case 6:
                                        case "end":
                                            return _context3.stop();
                                    }
                                }
                            },
                            _callee3,
                            this
                        );
                    })
                );

                function logout() {
                    return _ref4.apply(this, arguments);
                }

                return logout;
            })()

            /**
             * Add callback for when `identity` data is changed.
             * @param callback
             * @returns {Function} A function to remove the callback.
             */
        },
        {
            key: "onIdentity",
            value: function onIdentity(callback) {
                var _this3 = this;

                var length = this.callbacks.onIdentity.push(callback);
                return function() {
                    return _this3.callbacks.onIdentity.splice(length - 1, 1);
                };
            }
        }
    ]);
    return Authentication;
})();

exports.default = Authentication;
//# sourceMappingURL=authentication.js.map
