"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class IdentityTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("lastActive").date();
        this.column("lastLogin").date();
    }
}
exports.default = IdentityTable;
//# sourceMappingURL=identity.mysql.js.map
