export default {
    autoIncrement: null,
    name: "Completes",
    comment: "Main Completes table...",
    engine: "InnoDB",
    collate: "collate",
    defaultCharset: "utf8",
    columns: [
        {
            name: "blob",
            type: "BLOB",
            default: null,
            allowNull: true
        },
        {
            name: "char",
            type: "CHAR",
            default: null,
            allowNull: true,
            size: null
        },
        {
            name: "date",
            type: "DATE",
            default: null,
            allowNull: true
        },
        {
            name: "dateTime",
            type: "DATETIME",
            default: null,
            allowNull: true
        },
        {
            name: "decimal",
            type: "DECIMAL",
            default: null,
            allowNull: true,
            size: null,
            d: null
        },
        {
            name: "double",
            type: "DOUBLE",
            default: null,
            allowNull: true,
            size: null,
            d: null
        },
        {
            name: "enum",
            type: "ENUM",
            default: null,
            allowNull: true,
            values: []
        },
        {
            name: "float",
            type: "FLOAT",
            default: null,
            allowNull: true,
            size: null,
            d: null
        },
        {
            name: "int",
            type: "INT",
            default: null,
            allowNull: true,
            unsigned: false,
            autoIncrement: false,
            size: null
        },
        {
            name: "longBlob",
            type: "LONGBLOB",
            default: null,
            allowNull: true
        },
        {
            name: "longText",
            type: "LONGTEXT",
            default: null,
            allowNull: true
        },
        {
            name: "mediumBlob",
            type: "MEDIUMBLOB",
            default: null,
            allowNull: true
        },
        {
            name: "mediumInt",
            type: "MEDIUMINT",
            default: null,
            allowNull: true,
            unsigned: false,
            autoIncrement: false,
            size: null
        },
        {
            name: "mediumText",
            type: "MEDIUMTEXT",
            default: null,
            allowNull: true
        },
        {
            name: "smallInt",
            type: "SMALLINT",
            default: null,
            allowNull: true,
            unsigned: false,
            autoIncrement: false,
            size: null
        },
        {
            name: "text",
            type: "TEXT",
            default: null,
            allowNull: true
        },
        {
            name: "time",
            type: "TIME",
            default: null,
            allowNull: true
        },
        {
            name: "timestamp",
            type: "TIMESTAMP",
            default: null,
            allowNull: true
        },
        {
            name: "tinyInt",
            type: "TINYINT",
            default: null,
            allowNull: true,
            unsigned: false,
            autoIncrement: false,
            size: null
        },
        {
            name: "tinyText",
            type: "TINYTEXT",
            default: null,
            allowNull: true
        },
        {
            name: "varChar",
            type: "VARCHAR",
            default: null,
            allowNull: true,
            size: null
        },
        {
            name: "year",
            type: "YEAR",
            default: null,
            allowNull: true
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
            type: "KEY",
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
