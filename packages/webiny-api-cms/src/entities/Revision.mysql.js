// @flow
import MySQLTable from "../install/tables/mysqlTable";

class RevisionTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("updatedBy").char(24);
        this.column("name").varChar(100);
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("page").char(24);
        this.column("settings").text();
        this.column("content").text();
        this.column("published").tinyInt();
        this.column("locked").tinyInt();
    }
}

RevisionTable.setName("Cms_Revisions");

export default RevisionTable;
