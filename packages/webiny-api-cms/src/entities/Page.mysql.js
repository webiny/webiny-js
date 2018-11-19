// @flow
import MySQLTable from "../install/tables/mysqlTable";

class PageTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("updatedBy").char(24);
        this.column("title").varChar(300);
        this.column("url").varChar(300);
        this.column("content").mediumText();
        this.column("settings").mediumText();
        this.column("category").char(24);
        // Revision attributes
        this.column("version").int();
        this.column("parent").char(24);
        this.column("published").tinyInt();
        this.column("locked").tinyInt();

        this.index().unique("version", "parent");
        this.index().key("published", "version");
        this.index().key("parent");
        this.index().fullText("title");
    }
}

PageTable.setName("Cms_Pages");

export default PageTable;
