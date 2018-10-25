// @flow
import MySQLTable from "../install/tables/mysqlTable";

class MenuTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("slug").varChar(100);
        this.column("description").text(100);
    }
}

MenuTable.setName("Cms_Menus");

export default MenuTable;
