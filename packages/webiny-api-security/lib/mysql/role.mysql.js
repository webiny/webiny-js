"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Role extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("name")
            .varChar(50)
            .setNotNull();
        this.column("description")
            .varChar(200)
            .setNotNull();
        this.column("slug")
            .varChar(50)
            .setNotNull();
    }
}

Role.setName("Security_Roles");

exports.default = Role;
//# sourceMappingURL=role.mysql.js.map
