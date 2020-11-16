export default {
    db: {
        table: process.env.DB_TABLE_FORM_BUILDER,
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
        index: "form-builder",
        type: "_doc"
    }
};
