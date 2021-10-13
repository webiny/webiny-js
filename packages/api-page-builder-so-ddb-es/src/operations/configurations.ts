import WebinyError from "@webiny/error";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export default {
    db: () => ({
        table: process.env.DB_TABLE_PAGE_BUILDER || process.env.DB_TABLE,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            },
            { unique: true, name: "GSI1", fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }] }
        ]
    }),
    esDb: () => ({
        table: process.env.DB_TABLE_ELASTICSEARCH,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }),
    es: (context: PbContext) => {
        const tenant = context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "MISSING_TENANT");
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant.id}-page-builder`;

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};
