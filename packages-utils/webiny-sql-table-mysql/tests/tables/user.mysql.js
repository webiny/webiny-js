import Table from './table';

class UserTable extends Table {
    constructor() {
        super();
        this.column("id")
            .bigInt(20)
            .setUnsigned()
            .setAutoIncrement()
            .setAllowNull(false);
        this.column("name").varChar(100);
        this.column("type").enum("IT", "Marketing", "Animals");
        this.column("createdOn").dateTime();
    }
}

UserTable
    .setName('Users')
    .setComment('Main Users table...');

export default UserTable;
