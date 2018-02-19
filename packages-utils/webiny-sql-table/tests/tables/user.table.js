import Table from "./table";

class UserTable extends Table {
    constructor() {
        super();
        this.column("id")
            .int()
            .setUnsigned()
            .setAutoIncrement();
        this.column("total")
            .int()
            .setUnsigned(false)
            .setAutoIncrement(false);
        this.column("totalViews")
            .int()
            .setUnsigned(true)
            .setAutoIncrement(true);
        this.column("name").char();

        this.index("id").primary();
        this.index("name").unique();
    }
}

export default UserTable;
