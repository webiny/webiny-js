// @flow
import MySQLTable from "../install/tables/mysqlTable";

class PageTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("updatedBy").char(24);
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("content").text();
        this.column("settings").text();
        this.column("category").char(24);
        // Revision attributes
        this.column("version").int();
        this.column("parent").char(24);
        this.column("published").tinyInt();
        this.column("locked").tinyInt();

        this.index().unique("version", "parent");
    }
}

PageTable.setName("Cms_Pages");

export default PageTable;
