// @flow
import type { Table } from "webiny-sql-table";

export default (table: Table): string => {
    return `SHOW TABLES LIKE \`${table.getName()}\``;
};
