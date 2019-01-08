// @flow
import { MySQLTable } from "webiny-api";

class TagTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.index().unique("name");
    }
}

TagTable.setName("Cms_Tags");

export default TagTable;
