"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Role2Permission extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("role")
            .char(24)
            .setNotNull();
        this.column("permission")
            .char(24)
            .setNotNull();

        this.index("unique").unique("permission", "role");
    }
}

Role2Permission.setName("Security_Role2Permission");

exports.default = Role2Permission;
//# sourceMappingURL=role2Permission.mysql.js.map
