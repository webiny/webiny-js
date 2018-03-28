"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class Permission extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("name")
            .varChar(50)
            .setNotNull();
        this.column("slug")
            .varChar(50)
            .setNotNull();
        this.column("description")
            .varChar(200)
            .setNotNull();
        this.column("rules").json();
    }
}

Permission.setName("Security_Permissions");

exports.default = Permission;
//# sourceMappingURL=permission.mysql.js.map
