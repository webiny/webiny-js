import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

/* SQL row representation of StorageCmsModel. */
export interface IModelRow {
    tenant: string;
    modelId: string;
    name: string;
    singularApiName: string;
    pluralApiName: string;
    group: string;
    icon: string | null;
    description: string | null;
    fields: string;
    layout: string;
    tags: string | null;
    titleFieldId: string;
    descriptionFieldId: string | null;
    imageFieldId: string | null;
    isPrivate: boolean;
    isPlugin: boolean;
    authorization: string | null;
    createdBy_id: string | null;
    createdBy_displayName: string | null;
    createdBy_type: string | null;
    createdBy: string | null;
    createdOn: string | null;
    savedOn: string | null;
}

/* Validated against StorageCmsModel — TypeScript errors if StorageCmsModel gains a new field. */
const MODEL_COLUMN_MAP: Record<keyof StorageCmsModel, true> = {
    name: true,
    modelId: true,
    singularApiName: true,
    pluralApiName: true,
    tenant: true,
    group: true,
    icon: true,
    description: true,
    fields: true,
    layout: true,
    tags: true,
    titleFieldId: true,
    descriptionFieldId: true,
    imageFieldId: true,
    isPrivate: true,
    authorization: true,
    isPlugin: true,
    createdOn: true,
    savedOn: true,
    createdBy: true
};

export const MODEL_COLUMNS = Object.keys(MODEL_COLUMN_MAP) as (keyof StorageCmsModel)[];
