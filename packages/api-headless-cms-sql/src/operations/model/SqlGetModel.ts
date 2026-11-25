import type { CmsModelStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import type { IModelRow } from "./types.js";
import { GetModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { rowToModel } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

class SqlGetModelImpl implements GetModelStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private modelSchemaManager: ModelSchemaManager.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {
        this.tableName = tableNameResolver.resolve("models");
    }

    async execute(params: CmsModelStorageOperationsGetParams) {
        const tenant = this.scopeTenant.getId(params.tenant);

        await this.modelSchemaManager.ensure(this.tableName);

        const row = await this.knex
            .client<IModelRow>(this.tableName)
            .where("modelId", params.modelId)
            .where("tenant", tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToModel(row);
    }
}

export const SqlGetModel = GetModelStorageOperation.createImplementation({
    implementation: SqlGetModelImpl,
    dependencies: [KnexClient, TableNameResolver, ModelSchemaManager, ScopeTenant]
});
