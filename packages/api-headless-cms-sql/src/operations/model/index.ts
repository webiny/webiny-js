import type { Knex } from "knex";
import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams,
    StorageCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { TableNameResolver } from "~/utils/TableNameResolver.js";
import type { IModelRow } from "./types.js";
import { modelToRow } from "./mappers.js";
import { rowToModel } from "./mappers.js";

interface CreateModelsStorageOperationsParams {
    knex: Knex;
    tableNameResolver: TableNameResolver;
}

const MODELS_ENTITY = "models";

export const createModelsStorageOperations = (
    params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    const { knex, tableNameResolver } = params;

    const table = (tenant: string) => {
        const tableName = tableNameResolver.resolve(tenant, MODELS_ENTITY);

        return knex<IModelRow>(tableName);
    };

    const get = async (
        getParams: CmsModelStorageOperationsGetParams
    ): Promise<StorageCmsModel | null> => {
        const row = await table(getParams.tenant).where("modelId", getParams.modelId).first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    };

    const list = async (
        listParams: CmsModelStorageOperationsListParams
    ): Promise<StorageCmsModel[]> => {
        const { where } = listParams;

        const rows = await table(where.tenant).select<IModelRow[]>();

        return rows.map(rowToModel);
    };

    const create = async (
        createParams: CmsModelStorageOperationsCreateParams
    ): Promise<StorageCmsModel> => {
        const row = modelToRow(createParams.model);

        await table(createParams.model.tenant).insert(row);

        return createParams.model;
    };

    const update = async (
        updateParams: CmsModelStorageOperationsUpdateParams
    ): Promise<StorageCmsModel> => {
        const row = modelToRow(updateParams.model);

        await table(updateParams.model.tenant)
            .where("modelId", updateParams.model.modelId)
            .update(row);

        return updateParams.model;
    };

    const del = async (deleteParams: CmsModelStorageOperationsDeleteParams): Promise<void> => {
        await table(deleteParams.model.tenant)
            .where("modelId", deleteParams.model.modelId)
            .delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
