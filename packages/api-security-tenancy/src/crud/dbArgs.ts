export default {
    table: process.env.DB_TABLE_SECURITY,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] },
        { unique: true, name: "GSI1", fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }] }
    ]
};
