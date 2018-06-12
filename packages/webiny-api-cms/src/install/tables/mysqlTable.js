import { MySQLTable as BaseMySQLTable, api } from "webiny-api";

class MySQLTable extends BaseMySQLTable {}

MySQLTable.getDriver().setConnection(api.config.database.connection);

export default MySQLTable;
