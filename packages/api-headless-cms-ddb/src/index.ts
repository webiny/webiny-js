import type { CmsContext, StorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { createTable } from "~/definitions/table.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { DynamoDBClient } from "@webiny/db-dynamodb";

const createDynamoDbStorageOperations: StorageOperationsFactory = params => {
    const { table, container } = params;

    const db = container.resolve(DynamoDBClient);
    const documentClient = db.client;

    const tableInstance = createTable({
        name: table,
        documentClient
    });

    const entities = {
        groups: createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance
        }),
        models: createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance
        }),
        entries: createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance
        })
    };

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        container
    });

    return {
        name: "dynamodb",
        beforeInit: () => {
            entries.dataLoaders.clearAll();
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            container
        }),
        models: createModelsStorageOperations({
            entity: entities.models
        }),
        entries
    };
};

class DynamoDbStorageOperationsFactoryImpl
    implements StorageOperationsFactoryAbstraction.Interface
{
    public create(context: CmsContext) {
        return createDynamoDbStorageOperations({
            container: context.container
        });
    }
}

const DynamoDbStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation({
    implementation: DynamoDbStorageOperationsFactoryImpl,
    dependencies: []
});

/**
 * DI-native feature — registers the DynamoDB CMS storage operations factory.
 * Requires DynamoDBClient to be registered in the container first (via DbFeature).
 *
 * Usage:
 *   DbFeature.register(container, { documentClient, table });
 *   HeadlessCmsDdbFeature.register(container);
 *   // then in request: HeadlessCmsFeature.register(container, { type: "manage" });
 */
export const HeadlessCmsDdbFeature = createFeature({
    name: "cms.storageOperations.ddb",
    register: container => {
        FilterRegistriesFeature.register(container);
        container.register(DynamoDbStorageOperationsFactory).inSingletonScope();
    }
});

/** @deprecated use HeadlessCmsDdbFeature instead */
export const registerDynamoDbStorageOperations = () => {
    return [
        createRegisterExtensionPlugin(context => {
            return HeadlessCmsDdbFeature.register(context.container);
        })
    ];
};
