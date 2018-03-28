"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class RoleGroup extends _webinyApi.MySQLTable {
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

RoleGroup.setName("Security_RoleGroups");

exports.default = RoleGroup;
//# sourceMappingURL=roleGroup.mysql.js.map
