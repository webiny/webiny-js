import Table from './table';

class ComplexTable extends Table {
    constructor() {
        super();
        this.column("id")
            .bigInt(20)
            .setUnsigned()
            .setAutoIncrement()
            .setAllowNull();
        this.column("firstName").varChar(100);
        this.column("lastName").varChar(100);
        this.column("age").int(10);
        this.column("type")
            .enum("professional", "shoplifter", "brandRepresentative")
            .setDefault("professional");
        this.column("createdOn")
            .dateTime()
            .setDefault("NOW");

        this.index().primary("id");
        this.index("age").key("id");
        this.index("firstNameLastName").unique("firstName", "lastName");
        this.index("searchIndex").fullText("someSearchField");
    }
}

ComplexTable
    .setName('ComplexRecords')
    .setComment('Main Complex records table...')
    .setAutoIncrement(50)
    .setCollate('utf888');

export default ComplexTable;
