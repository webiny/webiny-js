export default {
    autoIncrement: null,
    name: "Companies",
    comment: "Main Companies table...",
    engine: "InnoDB",
    collate: "collate",
    defaultCharset: "utf8",
    columns: [
        {
            name: "id",
            type: "BIGINT",
            default: null,
            allowNull: true,
            unsigned: true,
            autoIncrement: true,
            size: 20
        },
        {
            name: "firstName",
            type: "VARCHAR",
            default: null,
            allowNull: true,
            size: 100
        },
        {
            name: "lastName",
            type: "VARCHAR",
            default: null,
            allowNull: true,
            size: 100
        },
        {
            name: "age",
            type: "INT",
            default: null,
            allowNull: true,
            unsigned: false,
            autoIncrement: false,
            size: 10
        },
        {
            name: "type",
            type: "ENUM",
            default: "professional",
            allowNull: true,
            values: ["professional", "shoplifter", "brandRepresentative"]
        },
        {
            name: "createdOn",
            type: "DATETIME",
            default: "NOW",
            allowNull: true
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
            type: "KEY",
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
