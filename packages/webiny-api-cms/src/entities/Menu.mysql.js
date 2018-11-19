// @flow
import MySQLTable from "../install/tables/mysqlTable";

class MenuTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(100);
        this.column("slug").varChar(100);
        this.column("description").text(100);
        this.column("items").text();
    }
}

MenuTable.setName("Cms_Menus");

export default MenuTable;
