"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class PageTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("category").char(24);
        this.column("status").enum("draft", "published", "trash");
    }
}

PageTable.setName("Cms_Pages");

exports.default = PageTable;
//# sourceMappingURL=page.mysql.js.map
