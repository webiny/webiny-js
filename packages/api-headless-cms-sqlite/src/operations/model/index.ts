import WebinyError from "@webiny/error";
import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams,
    StorageCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Database } from "@webiny/db-sqlite";
import { deleteRow, getRow, upsertRow } from "../../utils/row.js";
import { listByPk } from "../../utils/scan.js";

const partitionKey = (tenant: string) => `T#${tenant}#CMS#CM`;

export interface CreateModelsStorageOperationsParams {
    db: Database;
}

export const createModelsStorageOperations = (
    params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    const { db } = params;

    return {
        async create(p: CmsModelStorageOperationsCreateParams): Promise<StorageCmsModel> {
            const { model } = p;
            try {
                await upsertRow(db, { pk: partitionKey(model.tenant), sk: model.modelId }, model, {
                    gsiTenantPk: model.tenant
                });
                return model;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not create model.",
                    "CREATE_MODEL_ERROR",
                    { modelId: model.modelId }
                );
            }
        },

        async update(p: CmsModelStorageOperationsUpdateParams): Promise<StorageCmsModel> {
            const { model } = p;
            try {
                await upsertRow(db, { pk: partitionKey(model.tenant), sk: model.modelId }, model, {
                    gsiTenantPk: model.tenant
                });
                return model;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not update model.",
                    "UPDATE_MODEL_ERROR",
                    { modelId: model.modelId }
                );
            }
        },

        async delete(p: CmsModelStorageOperationsDeleteParams): Promise<void> {
            const { model } = p;
            await deleteRow(db, { pk: partitionKey(model.tenant), sk: model.modelId });
        },

        async get(p: CmsModelStorageOperationsGetParams): Promise<StorageCmsModel | null> {
            const { tenant, modelId } = p;
            try {
                return await getRow<StorageCmsModel>(db, {
                    pk: partitionKey(tenant),
                    sk: modelId
                });
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not get model.",
                    "GET_MODEL_ERROR",
                    { modelId }
                );
            }
        },

        async list(p: CmsModelStorageOperationsListParams): Promise<StorageCmsModel[]> {
            const { where } = p;
            try {
                return await listByPk<StorageCmsModel>(db, partitionKey(where.tenant));
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not list models.",
                    "LIST_MODEL_ERROR"
                );
            }
        }
    };
};
