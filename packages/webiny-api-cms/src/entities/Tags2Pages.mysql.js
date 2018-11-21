// @flow
import MySQLTable from "../install/tables/mysqlTable";

class Tags2Pages extends MySQLTable {
    constructor() {
        super();
        this.column("page").char(24);
        this.column("tag").char(24);

        this.index("page");
        this.index("tag");
    }
}

Tags2Pages.setName("Cms_Tags2Pages");

export default Tags2Pages;
