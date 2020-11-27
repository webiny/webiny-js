export default {
    db: {
        table: process.env.DB_TABLE_CMS_ENVIRONMENT,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es: {
        index: "cms-environment",
        type: "_doc"
    }
};
