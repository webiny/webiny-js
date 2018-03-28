"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Role2Permission = undefined;

var _webinyApi = require("webiny-api");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

var _permission = require("./permission.entity");

var _permission2 = _interopRequireDefault(_permission);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Role2Permission extends _webinyApi.Entity {
    constructor() {
        super();
        this.attr("role").entity(_role2.default);
        this.attr("permission").entity(_permission2.default);
    }
}

exports.Role2Permission = Role2Permission;
Role2Permission.classId = "Security.Role2Permission";
Role2Permission.tableName = "Security_Role2Permission";

exports.default = Role2Permission;
//# sourceMappingURL=role2Permission.entity.js.map
