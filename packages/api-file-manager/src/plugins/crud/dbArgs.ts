export default {
    table: process.env.DB_TABLE_FILE_MANGER,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};
