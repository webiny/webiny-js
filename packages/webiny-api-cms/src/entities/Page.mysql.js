// @flow
import MySQLTable from "../install/tables/mysqlTable";

class PageTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("category").char(24);
        this.column("settings").text();
        this.column("content").text();
        this.column("status").enum("draft", "published", "trash");
        this.column("pinned")
            .tinyInt(1)
            .setDefault(0);
    }
}

PageTable.setName("Cms_Pages");

export default PageTable;
