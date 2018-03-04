import FileTable from "./file.mysql";

class ImageTable extends FileTable {
    constructor() {
        super();

        this.column("preset").varChar(20);
        this.column("width")
            .mediumInt()
            .setUnsigned();
        this.column("height")
            .mediumInt()
            .setUnsigned();
    }
}

ImageTable.setName("Images");

export default ImageTable;
