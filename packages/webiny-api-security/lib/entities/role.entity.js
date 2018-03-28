"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _permission = require("./permission.entity");

var _permission2 = _interopRequireDefault(_permission);

var _roleGroup = require("./roleGroup.entity");

var _roleGroup2 = _interopRequireDefault(_roleGroup);

var _role2Permission = require("./role2Permission.entity");

var _role2Permission2 = _interopRequireDefault(_role2Permission);

var _role2RoleGroup = require("./role2RoleGroup.entity");

var _role2RoleGroup2 = _interopRequireDefault(_role2RoleGroup);

var _nameSlugDesc = require("./helpers/nameSlugDesc");

var _nameSlugDesc2 = _interopRequireDefault(_nameSlugDesc);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Role extends _webinyApi.Entity {
    constructor() {
        super();
        (0, _nameSlugDesc2.default)(this);
        this.attr("permissions")
            .entities(_permission2.default)
            .setUsing(_role2Permission2.default);

        this.attr("roleGroups")
            .entities(_roleGroup2.default)
            .setUsing(_role2RoleGroup2.default);
    }
}

Role.classId = "Security.Role";
Role.tableName = "Security_Roles";

exports.default = Role;
//# sourceMappingURL=role.entity.js.map
