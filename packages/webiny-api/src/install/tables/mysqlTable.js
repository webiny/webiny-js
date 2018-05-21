import { MySQLTable as BaseMySQLTable, app } from "../../";

class MySQLTable extends BaseMySQLTable {}

MySQLTable.getDriver().setConnection(app.config.database.connection);

export default MySQLTable;
