// @flow
import MySQLTable from "../../install/tables/mysqlTable";

class SettingsTable extends MySQLTable {
    constructor() {
        super();
        this.column("key").varChar(100);
        this.column("data").text();
    }
}

SettingsTable.setName("Settings");

export default SettingsTable;
