import type {
    CmsModelField,
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams,
    StorageCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { KnexInstance } from "~/schema/abstractions/index.js";
import { TableNameResolver } from "~/schema/abstractions/index.js";
import { ModelSchemaManager } from "~/schema/abstractions/index.js";
import { EntrySchemaManager } from "~/schema/abstractions/index.js";
import { modelToRow } from "./mappers.js";
import { rowToModel } from "./mappers.js";

const MODELS_ENTITY = "models";

/* Extract CmsModelField[] from StorageCmsModel.fields, which may be compressed. */
const extractFields = (model: StorageCmsModel): CmsModelField[] => {
    if (Array.isArray(model.fields)) {
        return model.fields;
    }

    return [];
};

export const createModelsStorageOperations = (
    knex: KnexInstance.Interface,
    tableNameResolver: TableNameResolver.Interface,
    modelSchemaManager: ModelSchemaManager.Interface,
    entrySchemaManager: EntrySchemaManager.Interface
): CmsModelStorageOperations => {
    const tableName = (tenant: string) => {
        return tableNameResolver.resolve(tenant, MODELS_ENTITY);
    };

    const ensureSchema = async (tenant: string) => {
        await modelSchemaManager.ensure(tableName(tenant));
    };

    const query = (tenant: string) => {
        return knex<IModelRow>(tableName(tenant));
    };

    const get = async (
        getParams: CmsModelStorageOperationsGetParams
    ): Promise<StorageCmsModel | null> => {
        await ensureSchema(getParams.tenant);

        const row = await query(getParams.tenant).where("modelId", getParams.modelId).first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    };

    const list = async (
        listParams: CmsModelStorageOperationsListParams
    ): Promise<StorageCmsModel[]> => {
        const { where } = listParams;

        await ensureSchema(where.tenant);

        const rows = await query(where.tenant).select<IModelRow[]>();

        return rows.map(rowToModel);
    };

    const create = async (
        createParams: CmsModelStorageOperationsCreateParams
    ): Promise<StorageCmsModel> => {
        const model = createParams.model;
        const row = modelToRow(model);

        await ensureSchema(model.tenant);
        await query(model.tenant).insert(row);

        const fields = extractFields(model);
        const entryTable = tableNameResolver.resolve(model.tenant, model.modelId);

        await entrySchemaManager.sync(entryTable, model.modelId, fields);

        return model;
    };

    const update = async (
        updateParams: CmsModelStorageOperationsUpdateParams
    ): Promise<StorageCmsModel> => {
        const model = updateParams.model;
        const row = modelToRow(model);

        await ensureSchema(model.tenant);
        await query(model.tenant).where("modelId", model.modelId).update(row);

        const fields = extractFields(model);
        const entryTable = tableNameResolver.resolve(model.tenant, model.modelId);

        await entrySchemaManager.sync(entryTable, model.modelId, fields);

        return model;
    };

    const del = async (deleteParams: CmsModelStorageOperationsDeleteParams): Promise<void> => {
        const model = deleteParams.model;

        await ensureSchema(model.tenant);
        await query(model.tenant).where("modelId", model.modelId).delete();

        const entryTable = tableNameResolver.resolve(model.tenant, model.modelId);

        await entrySchemaManager.drop(entryTable);
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
