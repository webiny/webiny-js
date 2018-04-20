// @flow
import { MySQLTable } from "webiny-api";

class PageTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(300);
        this.column("slug").varChar(300);
        this.column("category").char(24);
        this.column("content").json();
        this.column("status").enum("draft", "published", "trash");
    }
}

PageTable.setName("Cms_Pages");

export default PageTable;
