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
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { modelToRow, rowToModel } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

export const createModelsStorageOperations = (
    knex: KnexClient.Interface,
    tableNameResolver: TableNameResolver.Interface,
    modelSchemaManager: ModelSchemaManager.Interface
): CmsModelStorageOperations => {
    const tableName = tableNameResolver.resolve("models");

    const ensureSchema = async () => {
        await modelSchemaManager.ensure(tableName);
    };

    const query = () => {
        return knex.client<IModelRow>(tableName);
    };

    const get = async (
        params: CmsModelStorageOperationsGetParams
    ): Promise<StorageCmsModel | null> => {
        await ensureSchema();

        const row = await query()
            .where("modelId", params.modelId)
            .where("tenant", params.tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    };

    const list = async (
        params: CmsModelStorageOperationsListParams
    ): Promise<StorageCmsModel[]> => {
        await ensureSchema();

        const { where } = params;
        const qb = query()
            // We always need to filter by tenant.
            .where("tenant", where.tenant);

        /* Default sort by modelId ascending (alphabetical), matching DDB sort key behavior. */
        qb.orderBy("modelId", "asc");

        const rows = await qb.select<IModelRow[]>();

        return rows.map(rowToModel);
    };

    const create = async (
        params: CmsModelStorageOperationsCreateParams
    ): Promise<StorageCmsModel> => {
        const model = params.model;
        const row = modelToRow(model);

        await ensureSchema();
        await query().insert(row);

        return model;
    };

    const update = async (
        params: CmsModelStorageOperationsUpdateParams
    ): Promise<StorageCmsModel> => {
        const model = params.model;
        const row = modelToRow(model);

        await ensureSchema();
        await query().where("modelId", model.modelId).update(row);

        return model;
    };

    const deleteModel = async (params: CmsModelStorageOperationsDeleteParams): Promise<void> => {
        await ensureSchema();
        await query().where("modelId", params.model.modelId).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: deleteModel
    };
};
