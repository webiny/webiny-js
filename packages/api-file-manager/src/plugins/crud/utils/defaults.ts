import { SecurityContext } from "@webiny/api-security/types";
import { Context } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

export default {
    db: {
        table: process.env.DB_TABLE_FILE_MANGER,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    esDb: {
        table: process.env.DB_TABLE_ELASTICSEARCH,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es(context: Context<SecurityContext, TenancyContext>) {
        const tenant = context.security.getTenant();
        if (tenant) {
            return {
                index: tenant.id + "-file-manager"
            };
        }

        throw new Error("Tenant missing.");
    }
};
