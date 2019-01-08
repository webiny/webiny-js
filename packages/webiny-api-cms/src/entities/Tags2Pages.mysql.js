// @flow
import { MySQLTable } from "webiny-api";

class Tags2Pages extends MySQLTable {
    constructor() {
        super();
        this.column("page").char(24);
        this.column("tag").char(24);

        this.index().key("page");
        this.index().key("tag");
        this.index().unique("tag", "page");
    }
}

Tags2Pages.setName("Cms_Tags2Pages");

export default Tags2Pages;
