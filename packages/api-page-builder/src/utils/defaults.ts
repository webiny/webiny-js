import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context } from "@webiny/handler/types";

export default {
    db: {
        table: process.env.DB_TABLE_PAGE_BUILDER,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es(context: Context<TenancyContext>) {
        const tenant = context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new Error("Tenant missing.");
        }

        const index = tenant.id + "-page-builder";
        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};
