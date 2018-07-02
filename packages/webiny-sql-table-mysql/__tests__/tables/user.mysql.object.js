export default {
    autoIncrement: 1000,
    name: "Users",
    comment: "Main Users table...",
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
            name: "name",
            type: "varchar",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: [100],
            notNull: false
        },
        {
            arguments: [100],
            autoIncrement: null,
            default: null,
            name: "default",
            notNull: false,
            type: "varchar",
            unsigned: null
        },
        {
            arguments: [],
            autoIncrement: null,
            default: false,
            name: "enabled",
            notNull: false,
            type: "tinyint",
            unsigned: null
        },
        {
            arguments: [],
            autoIncrement: null,
            default: 50,
            name: "age",
            notNull: false,
            type: "tinyint",
            unsigned: null
        },
        {
            name: "type",
            type: "enum",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            arguments: ["IT", "Marketing", "Animals"],
            notNull: false
        },
        {
            arguments: [],
            name: "createdOn",
            type: "datetime",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            notNull: false
        },
        {
            arguments: [],
            name: "meta",
            type: "json",
            default: undefined,
            unsigned: null,
            autoIncrement: null,
            notNull: false
        }
    ],
    indexes: [
        {
            columns: ["id"],
            name: null,
            type: "PRIMARY"
        }
    ]
};
