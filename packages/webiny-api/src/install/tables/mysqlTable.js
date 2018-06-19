// @flow
import { MySQLTable as BaseMySQLTable, api } from "../..";
import type { MySQLDriver } from "webiny-sql-table-mysql";

class MySQLTable extends BaseMySQLTable {}

const driver: MySQLDriver = (MySQLTable.getDriver(): any);
driver.setConnection(api.config.database.connection);

export default MySQLTable;
