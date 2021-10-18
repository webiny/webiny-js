export default {
    db: () => ({
        table: process.env.DB_TABLE_I18N || process.env.DB_TABLE,
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
