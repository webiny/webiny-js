// @flow
import MySQLTable from "./mysqlTable";

class SettingsTable extends MySQLTable {
    constructor() {
        super();
        this.column("key").varChar(100);
        this.column("data").json();
    }
}

SettingsTable.setName("Settings");

export default SettingsTable;
