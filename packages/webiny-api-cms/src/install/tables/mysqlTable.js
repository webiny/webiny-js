// @flow
import { MySQLTable as BaseMySQLTable, api } from "webiny-api";
import type { MySQLDriver } from "webiny-sql-table-mysql";

class MySQLTable extends BaseMySQLTable {}

const driver: MySQLDriver = (MySQLTable.getDriver(): any);
driver.setConnection(api.config.entity.driver.getConnection().getInstance());

export default MySQLTable;
