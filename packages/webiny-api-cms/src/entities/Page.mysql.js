// @flow
import MySQLTable from "../install/tables/mysqlTable";

class PageTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("category").char(24);
        this.column("status").enum("draft", "published", "trash");
    }
}

PageTable.setName("Cms_Pages");

export default PageTable;
