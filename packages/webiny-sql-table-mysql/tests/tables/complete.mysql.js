import Table from "./table";

class CompleteTable extends Table {
    constructor() {
        super();
        this.column("blob").blob();
        this.column("char").char();
        this.column("date").date();
        this.column("dateTime").dateTime();
        this.column("decimal").decimal();
        this.column("double").double();
        this.column("enum").enum();
        this.column("float").float();
        this.column("int").int();
        this.column("longBlob").longBlob();
        this.column("longText").longText();
        this.column("mediumBlob").mediumBlob();
        this.column("mediumInt").mediumInt();
        this.column("mediumText").mediumText();
        this.column("smallInt").smallInt();
        this.column("text").text();
        this.column("time").time();
        this.column("timestamp").timestamp();
        this.column("tinyInt").tinyInt();
        this.column("tinyText").tinyText();
        this.column("varChar").varChar();
        this.column("year").year();

        this.index().primary("primary");
        this.index("key").key("key");
        this.index("unique").unique("one", "two", "three", "four");
        this.index("fullText").fullText("someSearchField");
    }
}

CompleteTable.setName("Completes").setComment("Main Completes table...");

export default CompleteTable;
