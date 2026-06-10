import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";

/* SQL row representation of CmsGroup. */
export interface IGroupRow {
    id: string;
    name: string;
    slug: string;
    tenant: string;
    description: string | null;
    icon: string | null;
    /* Filterable identity columns. */
    createdBy_id: string | null;
    createdBy_displayName: string | null;
    createdBy_type: string | null;
    /* Full identity as JSON for extensibility. */
    createdBy: string | null;
    createdOn: string | null;
    savedOn: string | null;
    isPrivate: boolean;
    isPlugin: boolean;
}

/* Validated against CmsGroup — TypeScript errors if CmsGroup gains a new field. */
const GROUP_COLUMN_MAP: Record<keyof CmsGroup, true> = {
    id: true,
    name: true,
    slug: true,
    tenant: true,
    description: true,
    icon: true,
    createdBy: true,
    createdOn: true,
    savedOn: true,
    isPrivate: true,
    isPlugin: true
};

export const GROUP_COLUMNS = Object.keys(GROUP_COLUMN_MAP) as (keyof CmsGroup)[];
