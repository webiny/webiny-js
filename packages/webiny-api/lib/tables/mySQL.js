"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinySqlTable = require("webiny-sql-table");

var _webinySqlTableMysql = require("webiny-sql-table-mysql");

class MySQLTable extends _webinySqlTable.Table {
    constructor() {
        super();
        this.column("id").char(24);

        this.column("createdOn").dateTime();
        this.column("createdBy").char(24);
        this.column("createdByClassId").varChar(100);

        this.column("savedOn").dateTime();
        this.column("savedBy").char(24);
        this.column("savedByClassId").varChar(100);

        this.column("updatedOn").dateTime();
        this.column("updatedBy").char(24);
        this.column("updatedByClassId").varChar(100);

        this.column("deleted")
            .tinyInt(1)
            .setDefault(0);

        this.index().primary("id");
    }
}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("utf8_general_ci");

MySQLTable.setDriver(new _webinySqlTableMysql.MySQLDriver());

exports.default = MySQLTable;
//# sourceMappingURL=mySQL.js.map
