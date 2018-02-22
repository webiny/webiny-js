export default {
    autoIncrement: 1000,
    name: "Companies",
    comment: "Main Companies table...",
    engine: "InnoDB",
    collate: "utf8_bin",
    defaultCharset: "utf8",
    columns: [
        {
            name: "id",
            type: "bigint",
            default: undefined,
            unsigned: true,
            autoIncrement: true,
            arguments: [20],
            notNull: true
        },
        {
            name: "firstName",
            type: "varchar",
            default: undefined,
            arguments: [100],
            unsigned: null,
            notNull: false,
            autoIncrement: null
        },
        {
            name: "lastName",
            type: "varchar",
            default: undefined,
            arguments: [100],
            unsigned: null,
            notNull: false,
            autoIncrement: null
        },
        {
            name: "age",
            type: "int",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: [10],
            notNull: false
        },
        {
            name: "type",
            type: "enum",
            default: "professional",
            arguments: ["professional", "shoplifter", "brandRepresentative"],
            unsigned: null,
            notNull: false,
            autoIncrement: null
        },
        {
            name: "createdOn",
            type: "datetime",
            default: "NOW",
            arguments: [],
            unsigned: null,
            notNull: false,
            autoIncrement: null
        }
    ],
    indexes: [
        {
            type: "PRIMARY",
            name: null,
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
