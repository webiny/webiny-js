import type { CmsModelStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { CreateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { modelToRow } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlCreateModelImpl implements CreateModelStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    async execute(params: CmsModelStorageOperationsCreateParams) {
        const model = params.model;
        const row = modelToRow(model);

        await this.modelSchemaManager.ensure(this.tableName);
        await this.knex.client<IModelRow>(this.tableName).insert(row);

        return model;
    }
}

export const SqlCreateModel = CreateModelStorageOperation.createImplementation({
    implementation: SqlCreateModelImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager]
});
