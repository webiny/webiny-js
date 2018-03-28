"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _authorizationError = require("./authorizationError");

var _authorizationError2 = _interopRequireDefault(_authorizationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Authorization {
    /**
     * Checks whether user can execute an API method.
     * @param {ApiMethod} apiMethod
     * @param {IAuthorizable} authorizable
     * @returns {Promise<boolean>}
     */
    canExecute(apiMethod, authorizable) {
        return (0, _asyncToGenerator3.default)(function*() {
            if (apiMethod.isPublic()) {
                return true;
            }

            const endpointClassId = apiMethod.getEndpoint().constructor.classId;
            const method = apiMethod.getName();

            const authorizationError = new _authorizationError2.default(
                `Not authorized to execute ${method} on ${endpointClassId}`,
                _authorizationError2.default.NOT_AUTHORIZED
            );

            if (!authorizable) {
                throw authorizationError;
            }

            const roles = yield authorizable.getRoles();
            for (let i = 0; i < roles.length; i++) {
                const permissions = yield roles[i].permissions;
                for (let j = 0; j < permissions.length; j++) {
                    const { rules } = permissions[j];
                    for (let k = 0; k < rules.length; k++) {
                        const rule = rules[k];
                        if (rule.classId === endpointClassId) {
                            for (let l = 0; l < rule.methods.length; l++) {
                                if (rule.methods[l].method === method) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            throw authorizationError;
        })();
    }
}
exports.default = Authorization;
//# sourceMappingURL=authorization.js.map
