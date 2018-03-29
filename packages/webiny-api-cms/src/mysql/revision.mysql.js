// @flow
import { MySQLTable } from "webiny-api";

class RevisionTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("page").char(24);
        this.column("content").json();
        this.column("active").tinyInt();
    }
}

RevisionTable.setName("Cms_Revisions");

export default RevisionTable;
