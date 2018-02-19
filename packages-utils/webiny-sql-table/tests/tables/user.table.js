import Table from "./table";

class UserTable extends Table {
    constructor() {
        super();
        this.column("id")
            .int(5)
            .setUnsigned()
            .setAutoIncrement();
        this.column("total")
            .int(6)
            .setUnsigned(false)
            .setAutoIncrement(false);
        this.column("totalViews")
            .int(7)
            .setUnsigned(true)
            .setAutoIncrement(true);
        this.column("name").char(8);

        this.index("id").primary();
        this.index("name").unique();
    }
}

export default UserTable;
