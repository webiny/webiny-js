"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _bcryptjs = require("bcryptjs");

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _authenticationError = require("../services/authenticationError");

var _authenticationError2 = _interopRequireDefault(_authenticationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Credentials strategy factory
 * @return {function(express$Request, Class<Identity>)}
 */
exports.default = (options = {}) => {
    const error = new _authenticationError2.default(
        "Invalid credentials.",
        _authenticationError2.default.INVALID_CREDENTIALS
    );

    const config = (0, _assign2.default)({}, options);

    // Default credentials provider
    if (typeof config.credentials !== "function") {
        config.credentials = req => {
            return {
                username: req.body.username,
                password: req.body.password
            };
        };
    }

    if (!config.usernameAttribute) {
        config.usernameAttribute = "username";
    }

    /**
     * Credentials authentication strategy.
     * It extracts credentials from request and tries loading the identity instance using the provided Identity class.
     * @param req
     * @param identity
     */
    return (req, identity) => {
        return new _promise2.default(
            (() => {
                var _ref = (0, _asyncToGenerator3.default)(function*(resolve, reject) {
                    const { username, password } = config.credentials(req);
                    const instance = yield identity.findOne({
                        query: { [config.usernameAttribute]: username }
                    });

                    if (!instance) {
                        return reject(error);
                    }

                    _bcryptjs2.default.compare(password, instance.password, function(err, res) {
                        if (err || !res) {
                            return reject(error);
                        }

                        resolve(instance);
                    });
                });

                return function(_x, _x2) {
                    return _ref.apply(this, arguments);
                };
            })()
        );
    };
};
//# sourceMappingURL=credentialsStrategy.js.map
