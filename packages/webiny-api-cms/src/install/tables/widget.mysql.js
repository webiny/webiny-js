// @flow
import MySQLTable from "./mysqlTable";

class WidgetTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(50);
        this.column("type").varChar(50);
        this.column("data").json();
        this.column("settings").json();
    }
}

WidgetTable.setName("Cms_Widgets");

export default WidgetTable;
