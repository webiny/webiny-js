export default {
    autoIncrement: null,
    name: "Completes",
    comment: "Main Completes table...",
    engine: "InnoDB",
    collate: "utf8_bin",
    defaultCharset: "utf8",
    columns: [
        {
            name: "blob",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "blob",
            default: undefined,
            arguments: []
        },
        {
            name: "char",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "char",
            default: undefined,
            arguments: []
        },
        {
            name: "date",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "date",
            default: undefined,
            arguments: []
        },
        {
            name: "dateTime",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "datetime",
            default: undefined,
            arguments: []
        },
        {
            name: "decimal",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "decimal",
            default: undefined,
            arguments: []
        },
        {
            name: "double",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "double",
            default: undefined,
            arguments: []
        },
        {
            name: "enum",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "enum",
            default: undefined,
            arguments: []
        },
        {
            name: "float",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "float",
            default: undefined,
            arguments: []
        },
        {
            name: "int",
            notNull: false,
            type: "int",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: []
        },
        {
            name: "longBlob",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "longblob",
            default: undefined,
            arguments: []
        },
        {
            name: "longText",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "longtext",
            default: undefined,
            arguments: []
        },
        {
            name: "mediumBlob",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "mediumblob",
            default: undefined,
            arguments: []
        },
        {
            name: "mediumInt",
            notNull: false,
            type: "mediumint",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: []
        },
        {
            name: "mediumText",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "mediumtext",
            default: undefined,
            arguments: []
        },
        {
            name: "smallInt",
            notNull: false,
            type: "smallint",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: []
        },
        {
            name: "text",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "text",
            default: undefined,
            arguments: []
        },
        {
            name: "time",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "time",
            default: undefined,
            arguments: []
        },
        {
            name: "timestamp",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "timestamp",
            default: undefined,
            arguments: []
        },
        {
            name: "tinyInt",
            notNull: false,
            type: "tinyint",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: []
        },
        {
            name: "tinyText",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "tinytext",
            default: undefined,
            arguments: []
        },
        {
            name: "varChar",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "varchar",
            default: undefined,
            arguments: []
        },
        {
            name: "year",
            notNull: false,
            autoIncrement: null,
            unsigned: null,
            type: "year",
            default: undefined,
            arguments: []
        }
    ],
    indexes: [
        {
            name: null,
            type: "PRIMARY",
            columns: ["primary"]
        },
        {
            name: "key",
            type: "",
            columns: ["key"]
        },
        {
            name: "unique",
            type: "UNIQUE",
            columns: ["one", "two", "three", "four"]
        },
        {
            name: "fullText",
            type: "FULLTEXT",
            columns: ["someSearchField"]
        }
    ]
};
