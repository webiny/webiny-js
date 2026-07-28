import type { CmsModelStorageOperationsListParams } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { rowToModel } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlListModelsImpl implements ListModelsStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    async execute(params: CmsModelStorageOperationsListParams) {
        await this.modelSchemaManager.ensure(this.tableName);

        const { where } = params;
        const qb = this.knex.client<IModelRow>(this.tableName).where("tenant", where.tenant);

        qb.orderBy("modelId", "asc");

        const rows = await qb.select<IModelRow[]>();

        return rows.map(rowToModel);
    }
}

export const SqlListModels = ListModelsStorageOperation.createImplementation({
    implementation: SqlListModelsImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager]
});
