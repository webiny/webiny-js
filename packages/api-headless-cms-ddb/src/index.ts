import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters/index.js";
import dynamoDbPlugins from "./dynamoDb/index.js";
import type { CmsContext, StorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins/index.js";
import { createTable } from "~/definitions/table.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export * from "./plugins/index.js";

const createDynamoDbStorageOperations: StorageOperationsFactory = params => {
    const { table, documentClient, plugins, getContainer } = params;

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

    plugins.register([
        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Field plugins for DynamoDB.
         */
        dynamoDbPlugins(),
        /**
         * Filter create plugins.
         */
        createFilterCreatePlugins()
    ]);

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        container: getContainer(),
        plugins
    });

    return {
        name: "dynamodb",
        beforeInit: async () => {
            entries.dataLoaders.clearAll();
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            plugins
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
    public async create(context: CmsContext) {
        return createDynamoDbStorageOperations({
            documentClient: context.db.driver.getClient() as DynamoDBDocument,
            plugins: context.plugins,
            getContainer: () => {
                return context.container;
            }
        });
    }
}

const DynamoDbStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation({
    implementation: DynamoDbStorageOperationsFactoryImpl,
    dependencies: []
});

const storageOperationsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        container.register(DynamoDbStorageOperationsFactory).inSingletonScope();
    }
});

export const registerDynamoDbStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });
};
