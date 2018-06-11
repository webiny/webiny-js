// @flow
import MySQLTable from "./mysqlTable";

class WidgetPreset extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(50);
        this.column("type").varChar(50);
        this.column("data").json();
    }
}

WidgetPreset.setName("Cms_WidgetPresets");

export default WidgetPreset;
