import mdbid from "mdbid";
import { DbContext } from "@webiny/handler-db/types";
import { TenancyContext, Tenant, TenantsCRUD } from "../types";
import dbArgs from "./dbArgs";

export default (context: DbContext & TenancyContext): TenantsCRUD => {
    const { db } = context;

    return {
        async getRootTenant() {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: `T#root`, SK: "A" },
                limit: 1
            });

            if (tenant) {
                return {
                    id: tenant.id,
                    name: tenant.name,
                    parent: tenant.parent
                };
            }

            return null;
        },
        async getTenant(id: string) {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: `T#${id}`, SK: "A" },
                limit: 1
            });

            if (tenant) {
                return {
                    id: tenant.id,
                    name: tenant.name,
                    parent: tenant.parent
                };
            }

            return null;
        },
        async listTenants({ parent }) {
            const [tenants] = await db.read<Tenant>({
                ...dbArgs,
                query: { GSI1_PK: `T#${parent}`, GSI1_SK: { $beginsWith: "T#" } },
                sort: { SK: -1 }
            });

            return tenants.map(t => ({ id: t.id, name: t.name, parent: t.parent }));
        },
        async createTenant(data) {
            const tenant = {
                ...data,
                id: data.id ?? mdbid()
            };

            await db.create({
                ...dbArgs,
                data: {
                    PK: `T#${tenant.id}`,
                    SK: "A",
                    TYPE: "SecurityTenant",
                    GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
                    GSI1_SK: data.parent ? `T#${tenant.id}` : undefined,
                    ...tenant
                }
            });

            return tenant;
        },
        async updateTenant(id, data) {
            await db.update({
                ...dbArgs,
                query: { PK: `T#${id}`, SK: "A" },
                data
            });

            return true;
        },
        async deleteTenant(id: string) {
            const [items] = await db.read({
                ...dbArgs,
                query: { PK: `T#${id}`, SK: { $gt: " " } }
            });

            const batch = db.batch();

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                batch.delete({
                    ...dbArgs,
                    query: { PK: item.PK, SK: item.SK }
                });
            }

            await batch.execute();

            // TODO: unlink users from tenant

            return true;
        }
    };
};
