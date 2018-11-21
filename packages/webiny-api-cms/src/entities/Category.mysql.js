// @flow
import MySQLTable from "../install/tables/mysqlTable";

class CategoryTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("slug").varChar(100);
        this.column("url").varChar(100);
        this.column("layout").varChar(50);

        this.index("slug");
    }
}

CategoryTable.setName("Cms_Categories");

export default CategoryTable;
