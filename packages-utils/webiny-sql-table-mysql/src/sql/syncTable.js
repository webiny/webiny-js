// @flow
import type { Table } from "webiny-sql-table";

export default (table: Table): string => {
    return `SYNC TABLE \`${table.getName()}\``;
};
