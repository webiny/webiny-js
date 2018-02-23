// @flow
import { Index } from "webiny-sql-table";

class KeyIndex extends Index {
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

export default KeyIndex;
