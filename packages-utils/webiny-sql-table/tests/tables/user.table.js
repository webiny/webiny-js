import Table from "./table";

class UserTable extends Table {
    constructor() {
        super();
        this.column("id")
            .int(5)
            .setNotNull(true)
            .setUnsigned()
            .setAutoIncrement();
        this.column("total")
            .int(6)
            .setUnsigned(false);
        this.column("totalViews")
            .int(7)
            .setUnsigned(true);
        this.column("name").char(8);

        this.index().primary("id");
        this.index("name").unique("name");
        this.index("totals").unique("total", "totalViews");
        this.index().unique("name", "total", "totalViews");
    }
}

UserTable.setName("Users");

export default UserTable;
