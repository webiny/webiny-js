import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";

export const groupToRow = (group: CmsGroup): IGroupRow => {
    return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        tenant: group.tenant,
        description: group.description ?? null,
        icon: group.icon ? JSON.stringify(group.icon) : null,
        createdBy_id: group.createdBy?.id ?? null,
        createdBy_displayName: group.createdBy?.displayName ?? null,
        createdBy_type: group.createdBy?.type ?? null,
        createdBy: group.createdBy ? JSON.stringify(group.createdBy) : null,
        createdOn: group.createdOn ?? null,
        savedOn: group.savedOn ?? null,
        isPrivate: group.isPrivate ?? false,
        isPlugin: group.isPlugin ?? false
    };
};

export const rowToGroup = (row: IGroupRow): CmsGroup => {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        tenant: row.tenant,
        description: row.description || null,
        icon: row.icon ? JSON.parse(row.icon) : null,
        createdBy: row.createdBy ? JSON.parse(row.createdBy) : undefined,
        createdOn: row.createdOn ?? undefined,
        savedOn: row.savedOn ?? undefined,
        isPrivate: row.isPrivate,
        isPlugin: row.isPlugin
    };
};
