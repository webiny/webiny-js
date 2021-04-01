import { CmsDatabaseConfig } from "./types";

export default {
    db: (): CmsDatabaseConfig => ({
        table: process.env.DB_TABLE_HEADLESS_CMS,
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
