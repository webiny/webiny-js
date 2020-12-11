import { CmsContext } from "@webiny/api-headless-cms/types";

export default {
    db: {
        table: process.env.DB_TABLE_HEADLESS_CMS,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es(context: CmsContext) {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new Error(`There is no tenant on "context.security".`);
        }
        const environment = context.cms.getEnvironment();
        if (!environment) {
            throw new Error(`There is no environment in "context.cms".`);
        }
        return {
            index: `${tenant.id}-cms-${context.cms.environment}`,
            type: "_doc"
        };
    }
};
