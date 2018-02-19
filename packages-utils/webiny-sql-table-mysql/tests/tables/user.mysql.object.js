export default {
    autoIncrement: null,
    name: "Users",
    comment: "Main Users table...",
    engine: "InnoDB",
    collate: "collate",
    defaultCharset: "utf8",
    columns: [
        {
            name: "id",
            type: "BIGINT",
            default: null,
            allowNull: false,
            unsigned: true,
            autoIncrement: true,
            size: 20
        },
        {
            name: "name",
            type: "VARCHAR",
            default: null,
            allowNull: true,
            size: 100
        },
        {
            name: "type",
            type: "ENUM",
            default: null,
            allowNull: true,
            values: ["IT", "Marketing", "Animals"]
        },
        {
            name: "createdOn",
            type: "DATETIME",
            default: null,
            allowNull: true
        }
    ],
    indexes: []
};
