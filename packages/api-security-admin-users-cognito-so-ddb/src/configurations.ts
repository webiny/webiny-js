export interface DatabaseConfig {
    table: string;
    keys: any[];
}

export const db: DatabaseConfig = {
    table: process.env.DB_TABLE_ADMIN_USERS,
    keys: [
        {
            primary: true,
            unique: true,
            name: "primary",
            fields: [
                {
                    name: "PK"
                },
                {
                    name: "SK"
                }
            ]
        },
        {
            unique: true,
            name: "GSI1",
            fields: [
                {
                    name: "GSI1_PK"
                },
                {
                    name: "GSI1_SK"
                }
            ]
        }
    ]
};
