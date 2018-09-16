// @flow
import MySQLTable from "../../install/tables/mysqlTable";

class FileTable extends MySQLTable {
    constructor() {
        super();
        this.column("name").varChar(100);
        this.column("src").text(255);
        this.column("type").varChar(20);
        this.column("size")
            .bigInt()
            .setUnsigned();
    }
}

FileTable.setName("Files");

export default FileTable;
