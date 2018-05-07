// @flow
import { MySQLTable } from "./..";

class SettingsTable extends MySQLTable {
    constructor() {
        super();
        this.index().unique("key");
    }

    setBaseColumns() {
        this.column("key").varChar(100);
        this.column("data").json();
    }
}

SettingsTable.setName("Settings");

export default SettingsTable;
