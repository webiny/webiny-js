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
import { createImplementation } from "@webiny/feature/api";
import { ModelStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/ModelStorageOperations.js";

class SqlModelStorageOperationsImpl implements CmsModelStorageOperations {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    private async ensureSchema() {
        await this.modelSchemaManager.ensure(this.tableName);
    }

    private query() {
        return this.knex.client<IModelRow>(this.tableName);
    }

    public async get(params: CmsModelStorageOperationsGetParams): Promise<StorageCmsModel | null> {
        await this.ensureSchema();

        const row = await this.query()
            .where("modelId", params.modelId)
            .where("tenant", params.tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    }

    public async list(params: CmsModelStorageOperationsListParams): Promise<StorageCmsModel[]> {
        await this.ensureSchema();

        const { where } = params;
        const qb = this.query().where("tenant", where.tenant);

        qb.orderBy("modelId", "asc");

        const rows = await qb.select<IModelRow[]>();

        return rows.map(rowToModel);
    }

    public async create(params: CmsModelStorageOperationsCreateParams): Promise<StorageCmsModel> {
        const model = params.model;
        const row = modelToRow(model);

        await this.ensureSchema();
        await this.query().insert(row);

        return model;
    }

    public async update(params: CmsModelStorageOperationsUpdateParams): Promise<StorageCmsModel> {
        const model = params.model;
        const row = modelToRow(model);

        await this.ensureSchema();
        await this.query().where("modelId", model.modelId).update(row);

        return model;
    }

    public async delete(params: CmsModelStorageOperationsDeleteParams): Promise<void> {
        await this.ensureSchema();
        await this.query().where("modelId", params.model.modelId).delete();
    }
}

export const SqlModelStorageOperations = createImplementation({
    abstraction: ModelStorageOperations,
    implementation: SqlModelStorageOperationsImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager]
});
