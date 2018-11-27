// @flow
import MySQLTable from "../install/tables/mysqlTable";

class ElementTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("type").varChar(50);
        this.column("content").text();
        this.column("preview").text();
        this.column("keywords").text();
        this.column("group").varChar(100);
    }
}

ElementTable.setName("Cms_Elements");

export default ElementTable;
