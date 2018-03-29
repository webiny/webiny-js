"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

class CategoryTable extends _webinyApi.MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(100);
        this.column("slug").varChar(100);
        this.column("url").varChar(100);
    }
}

CategoryTable.setName("Cms_Categories");

exports.default = CategoryTable;
//# sourceMappingURL=category.mysql.js.map
