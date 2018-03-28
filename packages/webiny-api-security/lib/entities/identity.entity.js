"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyApi = require("webiny-api");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

var _roleGroup = require("./roleGroup.entity");

var _roleGroup2 = _interopRequireDefault(_roleGroup);

var _identity2Role = require("./identity2Role.entity");

var _identity2Role2 = _interopRequireDefault(_identity2Role);

var _identity2RoleGroup = require("./identity2RoleGroup.entity");

var _identity2RoleGroup2 = _interopRequireDefault(_identity2RoleGroup);

var _onSetFactory = require("./helpers/onSetFactory");

var _onSetFactory2 = _interopRequireDefault(_onSetFactory);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 *
 * @property {EntityCollection<Role>} roles
 * @property {EntityCollection<RoleGroup>} roleGroups
 */
class Identity extends _webinyApi.Entity {
    constructor() {
        super();
        this.attr("roles")
            .entities(_role2.default, "identity", () => this.identityId)
            .setUsing(_identity2Role2.default)
            .onGet((0, _onSetFactory2.default)(_role2.default));

        this.attr("roleGroups")
            .entities(_roleGroup2.default, "identity", () => this.identityId)
            .setUsing(_identity2RoleGroup2.default)
            .onGet((0, _onSetFactory2.default)(_roleGroup2.default));
    }

    /**
     * Checks whether the user has the specified role.
     * @param {string} role
     * @returns {boolean}
     */
    // eslint-disable-next-line
    hasRole(role) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const roles = yield _this.getRoles();
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].slug === role) {
                    return true;
                }
            }
            return false;
        })();
    }

    /**
     * Returns all user's roles.
     * @returns {Array<Role>} All roles assigned to the user.
     */
    getRoles() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            let roles = [...(yield _this2.roles)];
            const groups = yield _this2.roleGroups;
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                const groupRoles = yield group.roles;
                roles = roles.concat(...groupRoles);
            }

            return roles;
        })();
    }
}

Identity.classId = "Security.Identity";

exports.default = Identity;
//# sourceMappingURL=identity.entity.js.map
