import { MySQLTable } from "./../index";

class FileTable extends MySQLTable {
    constructor() {
        super();

        this.column("name").varChar(100);
        this.column("title").varChar(100);
        this.column("size")
            .int(10)
            .setUnsigned();
        this.column("type").varChar(20);
        this.column("ext").varChar(5);
        this.column("key").varChar(250);
        this.column("src").varChar(250);
        this.column("tags").json();
        this.column("ref").char(24);
        this.column("refClassId").varChar(100);
        this.column("order")
            .smallInt(4)
            .setUnsigned();
    }
}

FileTable.setName("Files");

export default FileTable;
