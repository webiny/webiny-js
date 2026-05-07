import WebinyError from "@webiny/error";
import type {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import type { Database } from "@webiny/db-sqlite";
import { deleteRow, getRow, upsertRow } from "../../utils/row.js";
import { listByPk } from "../../utils/scan.js";

const partitionKey = (tenant: string) => `T#${tenant}#CMS#CMG`;
const sortKey = (id: string) => id;

const matchesWhere = (group: CmsGroup, where?: Record<string, unknown>): boolean => {
    if (!where) {
        return true;
    }
    for (const [field, value] of Object.entries(where)) {
        if (field === "tenant") {
            // Tenant scoping is enforced by the partition key — skip.
            continue;
        }
        if ((group as unknown as Record<string, unknown>)[field] !== value) {
            return false;
        }
    }
    return true;
};

const sortGroups = (groups: CmsGroup[], sort?: string[]): CmsGroup[] => {
    if (!sort || sort.length === 0) {
        return groups;
    }
    return [...groups].sort((a, b) => {
        for (const directive of sort) {
            const [field, direction] = directive.split("_");
            const dir = direction === "DESC" ? -1 : 1;
            const av = (a as unknown as Record<string, unknown>)[field!];
            const bv = (b as unknown as Record<string, unknown>)[field!];
            if (av === bv) {
                continue;
            }
            const aStr = av === null || av === undefined ? "" : String(av);
            const bStr = bv === null || bv === undefined ? "" : String(bv);
            if (aStr === bStr) {
                continue;
            }
            return aStr < bStr ? -dir : dir;
        }
        return 0;
    });
};

export interface CreateGroupsStorageOperationsParams {
    db: Database;
}

export const createGroupsStorageOperations = (
    params: CreateGroupsStorageOperationsParams
): CmsGroupStorageOperations => {
    const { db } = params;

    return {
        async create(p: CmsGroupStorageOperationsCreateParams): Promise<void> {
            const { group } = p;
            try {
                await upsertRow(
                    db,
                    { pk: partitionKey(group.tenant), sk: sortKey(group.id) },
                    group,
                    { gsiTenantPk: group.tenant }
                );
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not create group.",
                    "CREATE_GROUP_ERROR",
                    { id: group.id }
                );
            }
        },

        async update(p: CmsGroupStorageOperationsUpdateParams): Promise<void> {
            const { group } = p;
            try {
                await upsertRow(
                    db,
                    { pk: partitionKey(group.tenant), sk: sortKey(group.id) },
                    group,
                    { gsiTenantPk: group.tenant }
                );
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not update group.",
                    "UPDATE_GROUP_ERROR",
                    { id: group.id }
                );
            }
        },

        async delete(p: CmsGroupStorageOperationsDeleteParams): Promise<void> {
            const { group } = p;
            await deleteRow(db, { pk: partitionKey(group.tenant), sk: sortKey(group.id) });
        },

        async get(p: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> {
            const { tenant, id } = p;
            try {
                return await getRow<CmsGroup>(db, {
                    pk: partitionKey(tenant),
                    sk: sortKey(id)
                });
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not get group.",
                    "GET_GROUP_ERROR",
                    { id }
                );
            }
        },

        async list(p: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> {
            const { where, sort } = p;
            try {
                const all = await listByPk<CmsGroup>(db, partitionKey(where.tenant));
                const filtered = all.filter(g => matchesWhere(g, where));
                return sortGroups(filtered, sort);
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not list groups.",
                    "LIST_GROUP_ERROR"
                );
            }
        }
    };
};
