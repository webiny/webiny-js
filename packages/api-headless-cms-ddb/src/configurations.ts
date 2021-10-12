interface DatabaseConfigKeyFields {
    name: string;
}

interface DatabaseConfigKeys {
    primary: boolean;
    unique: boolean;
    name: string;
    fields: DatabaseConfigKeyFields[];
}

export interface CmsDatabaseConfig {
    table: string;
    keys: DatabaseConfigKeys[];
}

interface Configurations {
    db: () => CmsDatabaseConfig;
}

const configurations: Configurations = {
    db: () => ({
        table: process.env.DB_TABLE_HEADLESS_CMS || process.env.DB_TABLE,
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

export default configurations;
