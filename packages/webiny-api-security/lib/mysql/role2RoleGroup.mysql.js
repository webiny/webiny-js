"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Role2RoleGroup extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("role")
            .char(24)
            .setNotNull();
        this.column("roleGroup")
            .char(24)
            .setNotNull();

        this.index("unique").unique("roleGroup", "role");
    }
}

Role2RoleGroup.setName("Security_Role2RoleGroup");

exports.default = Role2RoleGroup;
//# sourceMappingURL=role2RoleGroup.mysql.js.map
