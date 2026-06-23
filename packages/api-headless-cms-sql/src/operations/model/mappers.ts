import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";

export const modelToRow = (model: StorageCmsModel): IModelRow => {
    return {
        tenant: model.tenant,
        modelId: model.modelId,
        name: model.name,
        singularApiName: model.singularApiName,
        pluralApiName: model.pluralApiName,
        group: model.group,
        icon: model.icon ? JSON.stringify(model.icon) : null,
        description: model.description ?? null,
        fields: JSON.stringify(model.fields),
        layout: JSON.stringify(model.layout),
        tags: model.tags ? JSON.stringify(model.tags) : null,
        titleFieldId: model.titleFieldId,
        descriptionFieldId: model.descriptionFieldId ?? null,
        imageFieldId: model.imageFieldId ?? null,
        isPrivate: model.isPrivate ?? false,
        isPlugin: model.isPlugin ?? false,
        authorization: model.authorization != null ? JSON.stringify(model.authorization) : null,
        createdBy_id: model.createdBy?.id ?? null,
        createdBy_displayName: model.createdBy?.displayName ?? null,
        createdBy_type: model.createdBy?.type ?? null,
        createdBy: model.createdBy ? JSON.stringify(model.createdBy) : null,
        createdOn: model.createdOn ?? null,
        savedOn: model.savedOn ?? null
    };
};

export const rowToModel = (row: IModelRow): StorageCmsModel => {
    return {
        tenant: row.tenant,
        modelId: row.modelId,
        name: row.name,
        singularApiName: row.singularApiName,
        pluralApiName: row.pluralApiName,
        group: row.group,
        icon: row.icon ? JSON.parse(row.icon) : null,
        description: row.description || null,
        fields: JSON.parse(row.fields),
        layout: JSON.parse(row.layout),
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        titleFieldId: row.titleFieldId,
        descriptionFieldId: row.descriptionFieldId,
        imageFieldId: row.imageFieldId,
        isPrivate: row.isPrivate,
        isPlugin: row.isPlugin,
        authorization: row.authorization ? JSON.parse(row.authorization) : undefined,
        createdBy: row.createdBy ? JSON.parse(row.createdBy) : undefined,
        createdOn: row.createdOn ?? undefined,
        savedOn: row.savedOn ?? undefined
    };
};
