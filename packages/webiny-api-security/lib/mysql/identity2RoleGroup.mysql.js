"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Identity2RoleGroupTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("identity")
            .varChar(50)
            .setNotNull();
        this.column("identityClassId")
            .varChar(50)
            .setNotNull();
        this.column("roleGroup")
            .char(24)
            .setNotNull();

        this.index("unique").unique("identity", "roleGroup");
    }
}

Identity2RoleGroupTable.setName("Security_Identity2RoleGroup");

exports.default = Identity2RoleGroupTable;
//# sourceMappingURL=identity2RoleGroup.mysql.js.map
