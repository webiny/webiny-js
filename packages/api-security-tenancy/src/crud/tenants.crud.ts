import mdbid from "mdbid";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { HandlerTenancyContext, Tenant, TenantsCRUD } from "../types";
import dbArgs from "./dbArgs";
import { SecurityPermission } from "@webiny/api-security/types";
import { paginateBatch } from "./paginateBatch";

type DbTenantGroup2User = {
    PK: string;
    SK: string;
    tenantId: string;
    tenantName: string;
    group: string;
    permissions: SecurityPermission[];
};

export default (context: HandlerContextDb & HandlerTenancyContext): TenantsCRUD => {
    const { db } = context;

    return {
        async getRoot() {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: `T#root`, SK: "A" },
                limit: 1
            });

            return tenant;
        },
        async get(id: string) {
            const [[tenant]] = await db.read<Tenant>({
                ...dbArgs,
                query: { PK: `T#${id}`, SK: "A" },
                limit: 1
            });

            return tenant;
        },
        async getUserPermissions(login) {
            const [tenants] = await db.read<DbTenantGroup2User>({
                ...dbArgs,
                query: { GSI1_PK: `U#${login}`, GSI1_SK: { $beginsWith: "T#" } }
            });

            return tenants.map(t => {
                return {
                    id: t.tenantId,
                    name: t.tenantName,
                    permissions: t.permissions
                };
            });
        },
        async list({ parent }) {
            const [tenants] = await db.read<Tenant>({
                ...dbArgs,
                query: { GSI1_PK: `T#${parent}`, GSI1_SK: { $beginsWith: "T#" } }
            });

            // Sort by ID in descending order
            return tenants
                .sort((a, b) => {
                    // Since `id` is a string, we can't just subtract the two values.
                    return a.id < b.id ? -1 : 1;
                })
                .map(t => ({ id: t.id, name: t.name, parent: t.parent }));
        },
        async create(data) {
            const tenant = {
                ...data,
                id: data.id ?? mdbid()
            };

            await db.create({
                data: {
                    PK: `T#${tenant.id}`,
                    SK: "A",
                    GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
                    GSI1_SK: data.parent ? `T#${tenant.id}` : undefined,
                    ...tenant
                }
            });

            return tenant;
        },
        async update(id, data) {
            await db.update({
                ...dbArgs,
                query: { PK: `T#${id}`, SK: "A" },
                data
            });

            return true;
        },
        async delete(id: string) {
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
            return true;
        },
        async linkUser(tenant, login, group) {
            await db.create({
                data: {
                    PK: `T#${tenant.id}`,
                    SK: `G2U#${group.slug}#${login}`,
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    group: group.slug,
                    permissions: group.permissions
                }
            });
        },
        async unlinkUser(tenant, login) {
            const [[link]] = await db.read({
                ...dbArgs,
                query: {
                    GSI1_PK: `U#${login}`,
                    GSI1_SK: { $beginsWith: `T#${tenant.id}` }
                },
                limit: 1
            });

            await db.delete({
                ...dbArgs,
                query: {
                    PK: link.PK,
                    SK: link.SK
                }
            });
        },
        async updateUserPermissions(tenant, slug, permissions) {
            const [links] = await db.read<DbTenantGroup2User>({
                ...dbArgs,
                query: {
                    PK: `T#${tenant.id}`,
                    SK: { $beginsWith: `G2U#${slug}#` }
                }
            });

            // BatchWrite can only handle 25 writes, so we need to paginate
            await paginateBatch<DbTenantGroup2User>(links, 25, items => {
                const batch = db.batch();
                for (let i = 0; i < items.length; i++) {
                    batch.update({
                        ...dbArgs,
                        query: { PK: items[i].PK, SK: items[i].SK },
                        data: Object.assign(items[i], { permissions })
                    });
                }
                return batch.execute();
            });
        }
    };
};
