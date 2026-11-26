import { beforeEach, describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import {
    ScopeTenant,
    createFixedScopeTenant
} from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { SqlCreateModel } from "~/operations/model/SqlCreateModel.js";
import { SqlListModels } from "~/operations/model/SqlListModels.js";
import { SqlCreateEntry } from "~/operations/entry/SqlCreateEntry.js";
import { SqlGetRevisionById } from "~/operations/entry/SqlGetRevisionById.js";

/**
 * Storage operations act on the tenant of the scope they were built in. A tenant passed to them
 * (`where.tenant`, `model.tenant`, `entry.tenant`, …) that differs from the scope's throws, instead
 * of reading or writing another tenant's records.
 */

interface ITestGlobals {
    __testKnex: Knex;
}

const SCOPE_TENANT = "root";
const OTHER_TENANT = "other";
const ENTRY_ID = "scopetenantentry";
const ID = createIdentifier({ id: ENTRY_ID, version: 1 });

const createModel = (tenant: string): CmsModel => {
    return {
        modelId: "scopeTenantModel",
        tenant,
        name: "Scope Tenant Model",
        singularApiName: "ScopeTenantModel",
        pluralApiName: "ScopeTenantModels",
        group: "group",
        icon: null,
        description: null,
        fields: [],
        layout: [],
        titleFieldId: "id"
    };
};

/**
 * SQL writes only read these fields, so the rest of the CmsEntry meta is left out.
 */
const createEntry = (tenant: string): CmsEntry => {
    return {
        id: ID,
        entryId: ENTRY_ID,
        tenant,
        modelId: "scopeTenantModel",
        version: 1,
        locked: false,
        status: "draft",
        values: { name: "entry" },
        location: { folderId: "root" }
    } as unknown as CmsEntry;
};

describe("SQL CMS storage and its scope's tenant", () => {
    const knex = () => (globalThis as unknown as ITestGlobals).__testKnex;
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(KnexClient, { client: knex() });
        container.registerInstance(ScopeTenant, createFixedScopeTenant(SCOPE_TENANT));
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        ModelSchemaManagerFeature.register(container);
        EntryTableManagerFeature.register(container);
        container.register(SqlCreateModel);
        container.register(SqlListModels);
        container.register(SqlCreateEntry);
        container.register(SqlGetRevisionById);
    });

    it("models of the scope's tenant are written and listed", async () => {
        const model = createModel(SCOPE_TENANT);
        await container.resolve(CreateModelStorageOperation).execute({ model });

        const models = await container
            .resolve(ListModelsStorageOperation)
            .execute({ where: { tenant: SCOPE_TENANT } });

        expect(models.map(m => [m.tenant, m.modelId])).toEqual([[SCOPE_TENANT, model.modelId]]);
    });

    it("listing models ignores the tenant the caller passes", async () => {
        const model = createModel(SCOPE_TENANT);
        await container.resolve(CreateModelStorageOperation).execute({ model });

        const models = await container
            .resolve(ListModelsStorageOperation)
            .execute({ where: { tenant: OTHER_TENANT } });

        expect(models.map(m => [m.tenant, m.modelId])).toEqual([[SCOPE_TENANT, model.modelId]]);
    });

    it("a model passed with another tenant is stored under the scope's tenant", async () => {
        const model = createModel(OTHER_TENANT);
        await container.resolve(CreateModelStorageOperation).execute({ model });

        const models = await container
            .resolve(ListModelsStorageOperation)
            .execute({ where: { tenant: SCOPE_TENANT } });
        expect(models.map(m => [m.tenant, m.modelId])).toEqual([[SCOPE_TENANT, model.modelId]]);
    });

    it("entries are written in the scope's tenant and read back", async () => {
        const model = createModel(SCOPE_TENANT);
        const entry = createEntry(SCOPE_TENANT);
        await container
            .resolve(CreateEntryStorageOperation)
            .execute(model, { entry, storageEntry: entry });

        const read = await container.resolve(GetRevisionByIdStorageOperation).execute(model, {
            id: ID
        });
        expect(read?.id).toEqual(ID);

        const tableName = container.resolve(EntryTableManager).getTableName();
        const rows = await knex()(tableName).select("tenant").where("id", ID);
        expect(rows).toEqual([{ tenant: SCOPE_TENANT }]);
    });

    it("reading an entry with a model of another tenant reads the scope's entry", async () => {
        const model = createModel(SCOPE_TENANT);
        const entry = createEntry(SCOPE_TENANT);
        await container
            .resolve(CreateEntryStorageOperation)
            .execute(model, { entry, storageEntry: entry });

        const read = await container
            .resolve(GetRevisionByIdStorageOperation)
            .execute(createModel(OTHER_TENANT), { id: ID });
        expect(read?.id).toEqual(ID);
    });

    it("an entry passed with another tenant is stored under the scope's tenant", async () => {
        const entry = createEntry(OTHER_TENANT);
        await container
            .resolve(CreateEntryStorageOperation)
            .execute(createModel(OTHER_TENANT), { entry, storageEntry: entry });

        const tableName = container.resolve(EntryTableManager).getTableName();
        const rows = await knex()(tableName).select("tenant").where("id", ID);
        expect(rows).toEqual([{ tenant: SCOPE_TENANT }]);
    });
});
