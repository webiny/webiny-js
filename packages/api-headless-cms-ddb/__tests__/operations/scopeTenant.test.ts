import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import {
    createFixedScopeTenant,
    ScopeTenant,
    TenantScopeMismatchError
} from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { CmsModel, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { HeadlessCmsDdbFeature } from "~/index.js";
import { createModel } from "./helpers/createModel.js";

/**
 * Storage operations take their tenant from the tenant scope they were built in. A caller passing
 * another tenant (a `where.tenant`, `model.tenant`, …) gets `TenantScopeMismatchError`.
 */
const createScope = (tenant: string) => {
    const root = new Container();
    DynamoDBCoreFeature.register(root, { documentClient: getDocumentClient() });
    HeadlessCmsDdbFeature.register(root);

    const scope = root.createChildContainer();
    scope.registerInstance(ScopeTenant, createFixedScopeTenant(tenant));
    scope.registerInstance(CmsStorageModelProvider, {
        getModel: model => model as unknown as StorageOperationsCmsModel<any>
    });
    return scope;
};

const createTenantModel = (tenant: string): CmsModel => {
    return {
        ...createModel(),
        modelId: `scopeTenantModel${Math.random().toString(36).slice(2, 10)}`,
        tenant
    };
};

describe("storage operations and the scope's tenant", () => {
    const tenant = `scopeTenant${Math.random().toString(36).slice(2, 10)}`;
    const otherTenant = `${tenant}Other`;

    it("throws when listing models with another tenant", async () => {
        const scope = createScope(tenant);

        await expect(
            scope.resolve(ListModelsStorageOperation).execute({
                where: { tenant: otherTenant }
            })
        ).rejects.toThrow(TenantScopeMismatchError);
    });

    it("throws when reading an entry of another tenant's model", async () => {
        const scope = createScope(tenant);
        const model = createTenantModel(otherTenant);

        await expect(
            scope
                .resolve(GetRevisionByIdStorageOperation)
                .execute(model, { id: "nonExistingEntry#0001" })
        ).rejects.toThrow(TenantScopeMismatchError);
    });
});
