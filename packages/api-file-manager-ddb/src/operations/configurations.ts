export default {
    db: () => ({
        table: process.env.DB_TABLE_FILE_MANGER || process.env.DB_TABLE,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    })
};
