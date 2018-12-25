// @flow
import { MySQLTable } from "./..";

class SettingsTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("key").varChar(100);
        this.column("data").text();
    }
}

SettingsTable.setName("Settings");

export default SettingsTable;
