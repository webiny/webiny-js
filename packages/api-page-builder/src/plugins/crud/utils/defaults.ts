import { PbContext } from "@webiny/api-page-builder/types";

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
    es(context: PbContext) {
        const tenant = context.security.getTenant();
        if (tenant) {
            return {
                index: tenant.id + "-page-builder"
            };
        }

        throw new Error("Tenant missing.");
    }
};
