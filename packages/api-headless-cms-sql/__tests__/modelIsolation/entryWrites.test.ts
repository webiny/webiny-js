import { beforeEach, describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { SqlCreateEntry } from "~/operations/entry/SqlCreateEntry.js";
import { SqlUpdateEntry } from "~/operations/entry/SqlUpdateEntry.js";
import { SqlDeleteEntry } from "~/operations/entry/SqlDeleteEntry.js";
import { SqlMoveEntry } from "~/operations/entry/SqlMoveEntry.js";
import { SqlMoveToBin } from "~/operations/entry/SqlMoveToBin.js";
import { SqlGetRevisionById } from "~/operations/entry/SqlGetRevisionById.js";

/**
 * Cross-model writes through the wrong model, within one tenant.
 *
 * These live in the SQL package because DynamoDB storage cannot pass them: its keys
 * (PK = tenant + entryId) have no model, so a write goes to the record by key alone.
 * Entry ids are unique per tenant across models, so this cannot happen through the API.
 * The cross-model reads and deleteMultiple tests stay in the shared api-headless-cms suite.
 */

interface ITestGlobals {
    __testKnex: Knex;
}

const TENANT = "root";
const ENTRY_X = "entryinmodelx";
const ID_X = createIdentifier({ id: ENTRY_X, version: 1 });

const createModel = (modelId: string): CmsModel => {
    return {
        modelId,
        tenant: TENANT,
        name: modelId,
        singularApiName: modelId,
        pluralApiName: `${modelId}s`,
        group: "group",
        icon: null,
        description: null,
        fields: [],
        layout: [],
        titleFieldId: "id"
    };
};

const modelX = createModel("isolationModelX");
const modelY = createModel("isolationModelY");

/**
 * SQL writes only read these fields, so the rest of the CmsEntry meta is left out.
 */
const createEntryX = (name: string): CmsEntry => {
    return {
        id: ID_X,
        entryId: ENTRY_X,
        tenant: TENANT,
        modelId: modelX.modelId,
        version: 1,
        locked: false,
        status: "draft",
        values: { name },
        location: { folderId: "root" }
    } as CmsEntry;
};

describe("SQL model isolation - entry writes", () => {
    let container: Container;

    beforeEach(async () => {
        const knex = (globalThis as unknown as ITestGlobals).__testKnex;

        container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        EntryTableManagerFeature.register(container);
        container.register(SqlCreateEntry);
        container.register(SqlUpdateEntry);
        container.register(SqlDeleteEntry);
        container.register(SqlMoveEntry);
        container.register(SqlMoveToBin);
        container.register(SqlGetRevisionById);

        const entry = createEntryX("original");
        await container
            .resolve(CreateEntryStorageOperation)
            .execute(modelX, { entry, storageEntry: entry });
    });

    const getEntryX = () => {
        return container.resolve(GetRevisionByIdStorageOperation).execute(modelX, { id: ID_X });
    };

    it("update through another model should not change the entry", async () => {
        const changed = createEntryX("changed");
        await container
            .resolve(UpdateEntryStorageOperation)
            .execute(modelY, { entry: changed, storageEntry: changed });

        expect((await getEntryX())?.values.name).toEqual("original");
    });

    it("delete through another model should not delete the entry", async () => {
        await container
            .resolve(DeleteEntryStorageOperation)
            .execute(modelY, { entry: createEntryX("original") });

        expect(await getEntryX()).not.toBeNull();
    });

    it("move through another model should not move the entry", async () => {
        await container.resolve(MoveEntryStorageOperation).execute(modelY, ID_X, "folder-y");

        expect((await getEntryX())?.location?.folderId).toEqual("root");
    });

    it("moveToBin through another model should not bin the entry", async () => {
        const binned = { ...createEntryX("original"), wbyDeleted: true };
        await container
            .resolve(MoveToBinStorageOperation)
            .execute(modelY, { entry: binned, storageEntry: binned });

        expect((await getEntryX())?.wbyDeleted).toBeFalsy();
    });
});
