"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Identity2RoleTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("identity")
            .varChar(50)
            .setNotNull();
        this.column("identityClassId")
            .varChar(50)
            .setNotNull();
        this.column("role")
            .char(24)
            .setNotNull();

        this.index("unique").unique("identity", "role");
    }
}

Identity2RoleTable.setName("Security_Identity2Role");

exports.default = Identity2RoleTable;
//# sourceMappingURL=identity2Role.mysql.js.map
