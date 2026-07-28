import type { CmsModelStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlDeleteModelImpl implements DeleteModelStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    async execute(params: CmsModelStorageOperationsDeleteParams) {
        await this.modelSchemaManager.ensure(this.tableName);
        await this.knex
            .client<IModelRow>(this.tableName)
            .where("modelId", params.model.modelId)
            .delete();
    }
}

export const SqlDeleteModel = DeleteModelStorageOperation.createImplementation({
    implementation: SqlDeleteModelImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager]
});
