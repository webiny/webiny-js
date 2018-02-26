import MySQLTable from "./../index";

class FileTable extends MySQLTable {
    constructor() {
        super();

        this.column("name").varChar(100);
        this.column("title").varChar(100);
        this.column("size").int(10);
        this.column("type").varChar(20);
        this.column("ext").varChar(5);
        this.column("src").varChar(250);
        this.column("tags").text(); // TODO: @adrian JSON array
        this.column("ref").bigInt(20);
        this.column("order").int(4);
    }
}

FileTable.setName("Files");

export default FileTable;
