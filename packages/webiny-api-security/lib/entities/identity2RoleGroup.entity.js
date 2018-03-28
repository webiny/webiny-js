"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _roleGroup = require("./roleGroup.entity");

var _roleGroup2 = _interopRequireDefault(_roleGroup);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Identity2RoleGroup extends _webinyApi.Entity {
    constructor() {
        super();
        this.attr("identity").identity({ classIdAttribute: "identityClassId" });
        this.attr("identityClassId").char();
        this.attr("roleGroup").entity(_roleGroup2.default);
    }
}

Identity2RoleGroup.classId = "Security.Identity2RoleGroup";
Identity2RoleGroup.tableName = "Security_Identity2RoleGroup";

exports.default = Identity2RoleGroup;
//# sourceMappingURL=identity2RoleGroup.entity.js.map
