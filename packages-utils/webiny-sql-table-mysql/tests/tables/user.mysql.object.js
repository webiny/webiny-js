export default {
    autoIncrement: null,
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
