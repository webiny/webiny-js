import dynamoDbPlugins from "./dynamoDb/index.js";
import type { CmsContext, StorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { createFilterCreatePlugins } from "@webiny/api-headless-cms-storage";
import { createTable } from "~/definitions/table.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";

export * from "./plugins/index.js";

const createDynamoDbStorageOperations: StorageOperationsFactory = params => {
    const { table, plugins, container } = params;

    const tableFactory = container.resolve(DynamoDbTableFactory);
    const entityFactory = container.resolve(DynamoDbEntityFactory);

    const client = createTable({
        name: table,
        tableFactory
    });

    const entities = {
        groups: createGroupEntity({
            entityName: ENTITIES.GROUPS,
            client,
            entityFactory
        }),
        models: createModelEntity({
            entityName: ENTITIES.MODELS,
            client,
            entityFactory
        }),
        entries: createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            client,
            entityFactory
        })
    };

    plugins.register([
        /*
         * Field plugins for DynamoDB.
         */
        dynamoDbPlugins(),
        /*
         * Filter create plugins.
         */
        createFilterCreatePlugins()
    ]);

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        container,
        plugins
    });

    return {
        name: "dynamodb",
        beforeInit: async () => {
            entries.dataLoaders.clearAll();
        },
        getEntities: () => entities,
        getTable: () => client,
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
    public async create(context: CmsContext) {
        return createDynamoDbStorageOperations({
            plugins: context.plugins,
            container: context.container
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
    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });
    plugin.name = "cms.registerDynamoDbStorageOperations";

    return [plugin];
};
