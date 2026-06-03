import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams,
    StorageCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { modelToRow } from "./mappers.js";
import { rowToModel } from "./mappers.js";

export const createModelsStorageOperations = (
    knex: KnexInstance.Interface,
    tableNameResolver: TableNameResolver.Interface,
    modelSchemaManager: ModelSchemaManager.Interface
): CmsModelStorageOperations => {
    const tableName = tableNameResolver.resolve("models");

    const ensureSchema = async () => {
        await modelSchemaManager.ensure(tableName);
    };

    const query = () => {
        return knex<IModelRow>(tableName);
    };

    const get = async (
        getParams: CmsModelStorageOperationsGetParams
    ): Promise<StorageCmsModel | null> => {
        await ensureSchema();

        const row = await query().where("modelId", getParams.modelId).first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    };

    const list = async (
        _listParams: CmsModelStorageOperationsListParams
    ): Promise<StorageCmsModel[]> => {
        await ensureSchema();

        const rows = await query().select<IModelRow[]>();

        return rows.map(rowToModel);
    };

    const create = async (
        createParams: CmsModelStorageOperationsCreateParams
    ): Promise<StorageCmsModel> => {
        const model = createParams.model;
        const row = modelToRow(model);

        await ensureSchema();
        await query().insert(row);

        return model;
    };

    const update = async (
        updateParams: CmsModelStorageOperationsUpdateParams
    ): Promise<StorageCmsModel> => {
        const model = updateParams.model;
        const row = modelToRow(model);

        await ensureSchema();
        await query().where("modelId", model.modelId).update(row);

        return model;
    };

    const del = async (deleteParams: CmsModelStorageOperationsDeleteParams): Promise<void> => {
        const model = deleteParams.model;

        await ensureSchema();
        await query().where("modelId", model.modelId).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
