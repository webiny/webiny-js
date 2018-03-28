"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinySqlTable = require("webiny-sql-table");

class KeyIndex extends _webinySqlTable.Index {
    getType() {
        return "";
    }

    getSQLValue() {
        let columns = this.getColumns();
        columns = columns.map(item => `\`${item}\``).join(", ");

        let sql = "KEY";
        if (this.getType()) {
            sql = this.getType() + " KEY";
        }

        sql += ` \`${this.getName()}\``;
        sql += ` (${columns})`;
        return sql;
    }
}
exports.default = KeyIndex;
//# sourceMappingURL=keyIndex.js.map
