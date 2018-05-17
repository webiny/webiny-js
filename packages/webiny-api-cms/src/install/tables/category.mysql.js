// @flow
import MySQLTable from "./mysqlTable";

class CategoryTable extends MySQLTable {
    constructor() {
        super();
        this.column("title").varChar(100);
        this.column("slug").varChar(100);
        this.column("url").varChar(100);
    }
}

CategoryTable.setName("Cms_Categories");

export default CategoryTable;
