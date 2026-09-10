import type { CmsModelStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { UpdateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { modelToRow } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlUpdateModelImpl implements UpdateModelStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    async execute(params: CmsModelStorageOperationsUpdateParams) {
        const model = params.model;
        const row = modelToRow(model);

        await this.modelSchemaManager.ensure(this.tableName);
        await this.knex
            .client<IModelRow>(this.tableName)
            .where("modelId", model.modelId)
            .update(row);

        return model;
    }
}

export const SqlUpdateModel = UpdateModelStorageOperation.createImplementation({
    implementation: SqlUpdateModelImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager]
});
