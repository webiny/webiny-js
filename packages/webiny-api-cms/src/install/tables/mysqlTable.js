import { MySQLTable as BaseMySQLTable, app } from "webiny-api";

class MySQLTable extends BaseMySQLTable {}

MySQLTable.getDriver().setConnection(app.config.database.connection);

export default MySQLTable;
