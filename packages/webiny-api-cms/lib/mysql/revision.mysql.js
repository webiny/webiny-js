"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class RevisionTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("page").char(24);
        this.column("content").json();
        this.column("active").tinyInt();
    }
}

RevisionTable.setName("Cms_Revisions");

exports.default = RevisionTable;
//# sourceMappingURL=revision.mysql.js.map
