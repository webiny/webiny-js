import Table from "./table";

class UserTable extends Table {
    constructor() {
        super();
        this.column("id")
            .bigInt(20)
            .setUnsigned()
            .setAutoIncrement()
            .setNotNull();
        this.column("name").varChar(100);
        this.column("default")
            .varChar(100)
            .setDefault(null);
        this.column("enabled")
            .tinyInt()
            .setDefault(false);
        this.column("type").enum("IT", "Marketing", "Animals");
        this.column("createdOn").dateTime();

        this.index().primary("id");
    }
}

UserTable.setName("Users").setComment("Main Users table...");

export default UserTable;
