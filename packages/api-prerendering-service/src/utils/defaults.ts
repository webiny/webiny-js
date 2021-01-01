export default {
    db: {
        table: process.env.DB_TABLE_PRERENDERING_SERVICE,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }
};
