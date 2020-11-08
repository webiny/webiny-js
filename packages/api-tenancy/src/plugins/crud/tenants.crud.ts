import KSUID from "ksuid";
import { Tenant } from "@webiny/api-tenancy/types";
import { HandlerContextDb } from "@webiny/handler-db/types";

export const PK_TENANT = "T";

export const dbArgs = {
    table: process.env.DB_TABLE_TENANTS,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};

export default (context: HandlerContextDb) => {
    const { db } = context;

    return {
        async getDefault() {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: PK_TENANT, SK: "default" },
                limit: 1
            });

            return tenant;
        },
        async getById(id: string) {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: PK_TENANT, SK: id },
                limit: 1
            });

            return tenant;
        },
        async list({ parent }) {
            const [tenants] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: PK_TENANT, SK: { $gt: " " } }
            });

            if (parent) {
                return tenants
                    .filter(t => t.parent === parent)
                    // Sort by ID in descending order
                    .sort((a, b) => {
                        return a.id < b.id;
                    });
            }

            return tenants;
        },
        async create(data) {
            const tenant = {
                ...data,
                id: data.id ?? KSUID.randomSync().string
            };

            await db.create({
                ...dbArgs,
                data: {
                    PK: PK_TENANT,
                    SK: tenant.id,
                    ...tenant
                }
            });

            return tenant;
        },
        async update(id, data) {
            await db.update({
                ...dbArgs,
                query: { PK: PK_TENANT, SK: id },
                data
            });

            return data;
        },
        async delete(id: string) {
            await db.delete({
                ...dbArgs,
                query: { PK: PK_TENANT, SK: id },
                limit: 1
            });

            return true;
        }
    };
};
