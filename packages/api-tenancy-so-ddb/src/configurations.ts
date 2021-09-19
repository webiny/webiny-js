export interface TenancyDatabaseConfig {
    table: string;
    keys: any[];
}

interface Configurations {
    db: () => TenancyDatabaseConfig;
}

const configurations: Configurations = {
    db: () => ({
        table: process.env.DB_TABLE_TENANCY,
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
    })
};

export default configurations;
