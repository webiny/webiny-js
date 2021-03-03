import { Configuration } from "./types";

export const configuration: Configuration = {
    db: () => ({
        table: process.env.DB_TABLE_TARGET || "TargetTable",
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
            }
        ]
    }),
    esDb: () => ({
        table: process.env.DB_TABLE_ELASTICSEARCH,
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
            }
        ]
    }),
    /**
     * Elasticsearch config is created with tenant in mind. So different tenants do not have access to each others data.
     */
    es(context) {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new Error(`There is no tenant on "context.security".`);
        }
        return {
            index: `${tenant.id}-target`
        };
    }
};
