"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _index = require("./../index");

var _authenticationError = require("./authenticationError");

var _authenticationError2 = _interopRequireDefault(_authenticationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Authentication {
    constructor(config) {
        this.config = config;
    }

    /**
     * Create an authentication token for the given user
     * @param identity
     * @param expiresOn
     */
    createToken(identity, expiresOn) {
        return this.config.token.encode(identity, expiresOn);
    }

    /**
     * Verify token and return Identity instance.
     * @param {string} token
     * @return {Promise<null|Identity>} Identity instance.
     */
    verifyToken(token) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const decoded = yield _this.config.token.decode(token);
            let identity = _this.getIdentityClass(decoded.data.classId);

            if (!identity) {
                throw new _authenticationError2.default(
                    `Unknown identity '${decoded.data.classId}'`,
                    _authenticationError2.default.UNKNOWN_IDENTITY,
                    { classId: decoded.data.classId }
                );
            }

            const identityId = decoded.data.identityId;
            const instance = yield identity.findById(identityId);
            if (!instance) {
                throw new _authenticationError2.default(
                    `Identity ID ${identityId} not found!`,
                    _authenticationError2.default.IDENTITY_INSTANCE_NOT_FOUND
                );
            }

            return instance;
        })();
    }

    /**
     * Authenticate request.
     * @param req
     * @param identity
     * @param strategy
     * @returns {Identity} A valid system Identity.
     */
    authenticate(req, identity, strategy) {
        const strategyFn = this.config.strategies[strategy];
        if (!strategyFn) {
            return _promise2.default.reject(
                new _authenticationError2.default(
                    `Strategy "${strategy}" not found!`,
                    _authenticationError2.default.UNKNOWN_STRATEGY,
                    { strategy }
                )
            );
        }

        return strategyFn(req, identity);
    }

    /**
     * Returns Identity class for given `classId`.
     * @param {string} classId
     * @returns {Class<Identity>} Identity class corresponding to given `classId`.
     */
    getIdentityClass(classId) {
        for (let i = 0; i < this.config.identities.length; i++) {
            if (this.config.identities[i].identity.classId === classId) {
                return this.config.identities[i].identity;
            }
        }
        return null;
    }

    /**
     * Returns set `Identity` classes.
     * @returns {Array<Class<Identity>>} Set `Identity` classes.
     */
    getIdentityClasses() {
        return this.config.identities.map(current => {
            return current.identity;
        });
    }
}

exports.default = Authentication;
//# sourceMappingURL=authentication.js.map
