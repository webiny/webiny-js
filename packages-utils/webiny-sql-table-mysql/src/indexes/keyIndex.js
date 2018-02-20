// @flow
import { Index } from "webiny-sql-table";

class KeyIndex extends Index {
    getType() {
        return "";
    }

    getSQLValue() {
        let columns = this.getColumns();
        if (Array.isArray(columns) && columns.length) {
            columns = columns.map(item => `\`${item}\``).join(", ");
        } else {
            columns = `\`${this.getName()}\``;
        }

        let sql = "KEY";
        if (this.getType()) {
            sql = this.getType() + " KEY";
        }

        if (this.getName()) {
            sql += ` ${this.getName()}`;
        }

        sql += ` (${columns})`;
        return sql;
    }
}

export default KeyIndex;
