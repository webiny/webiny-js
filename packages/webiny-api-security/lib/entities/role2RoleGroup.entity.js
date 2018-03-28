"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

var _roleGroup = require("./roleGroup.entity");

var _roleGroup2 = _interopRequireDefault(_roleGroup);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Role2RoleGroup extends _webinyApi.Entity {
    constructor() {
        super();
        this.attr("role").entity(_role2.default);
        this.attr("roleGroup").entity(_roleGroup2.default);
    }
}

Role2RoleGroup.classId = "Security.Role2RoleGroup";
Role2RoleGroup.tableName = "Security_Role2RoleGroup";

exports.default = Role2RoleGroup;
//# sourceMappingURL=role2RoleGroup.entity.js.map
