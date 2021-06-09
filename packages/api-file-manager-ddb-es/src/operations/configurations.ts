import {FileManagerContext} from "@webiny/api-file-manager/types";


export default {
    db: () => ({
        table: process.env.DB_TABLE_FILE_MANGER,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
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
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }),
    es(context: FileManagerContext) {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new Error("Tenant missing.");
        }
        
        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant.id}-file-manager`;
        
        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};