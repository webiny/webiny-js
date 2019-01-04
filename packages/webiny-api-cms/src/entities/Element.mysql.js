// @flow
import { MySQLTable } from "webiny-api";

class ElementTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("type").varChar(50);
        this.column("content").text();
        this.column("preview").text();
        this.column("category").varChar(255);
    }
}

ElementTable.setName("Cms_Elements");

export default ElementTable;