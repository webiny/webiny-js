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

        this.index("id").primary();
        this.index("name").unique();
        this.index("totals").unique("total", "totalViews");
    }
}

UserTable.setName("Users");

export default UserTable;
