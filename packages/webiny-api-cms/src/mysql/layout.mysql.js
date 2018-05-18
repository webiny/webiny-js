// @flow
import { MySQLTable } from "webiny-api";

class LayoutTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(100);
        this.column("slug").varChar(100);
        this.column("content").json();
    }
}

LayoutTable.setName("Cms_Layouts");

export default LayoutTable;
