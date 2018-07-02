export default {
    autoIncrement: 50,
    name: "ComplexRecords",
    comment: "Main Complex records table...",
    engine: "InnoDB",
    collate: "utf888",
    defaultCharset: "utf8",
    columns: [
        {
            name: "id",
            type: "bigint",
            default: undefined,
            unsigned: true,
            autoIncrement: true,
            notNull: true,
            arguments: [20]
        },
        {
            name: "firstName",
            type: "varchar",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            notNull: false,
            arguments: [100]
        },
        {
            name: "lastName",
            type: "varchar",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            notNull: false,
            arguments: [100]
        },
        {
            name: "age",
            type: "int",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            notNull: false,
            arguments: [10]
        },
        {
            name: "type",
            type: "enum",
            default: "professional",
            unsigned: null,
            autoIncrement: null,
            notNull: false,
            arguments: ["professional", "shoplifter", "brandRepresentative"]
        },
        {
            name: "createdOn",
            type: "datetime",
            notNull: false,
            default: "NOW",
            unsigned: null,
            autoIncrement: null,
            arguments: []
        }
    ],
    indexes: [
        {
            name: null,
            type: "PRIMARY",
            columns: ["id"]
        },
        {
            name: "age",
            type: "",
            columns: ["id"]
        },
        {
            name: "firstNameLastName",
            type: "UNIQUE",
            columns: ["firstName", "lastName"]
        },
        {
            name: "searchIndex",
            type: "FULLTEXT",
            columns: ["someSearchField"]
        }
    ]
};
