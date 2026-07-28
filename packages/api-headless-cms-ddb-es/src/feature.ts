import { createTable, DynamoDBClient } from "@webiny/db-dynamodb";
import { ENTITIES } from "~/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch";
import { CreateElasticsearchIndexTask } from "~/tasks/CreateElasticsearchIndexTask.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { FilterUtilFeature } from "@webiny/db-dynamodb/feature/FilterUtil/feature.js";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { CmsDdbEsTable } from "~/abstractions/CmsDdbEsTable.js";
import { CmsDdbEsOsTable } from "~/abstractions/CmsDdbEsOsTable.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { DdbEsGroupStorageOperations } from "~/operations/group/DdbEsGroupStorageOperations.js";
import { DdbEsModelStorageOperations } from "~/operations/model/DdbEsModelStorageOperations.js";
import { DdbEsEntryStorageOpsFeature } from "~/DdbEsEntryStorageOpsFeature.js";

export const HeadlessCmsDdbEsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        CmsEntryOpenSearchUtilsFeature.register(container);
        FilterRegistriesFeature.register(container);
        FilterUtilFeature.register(container);

        container.register(CreateElasticsearchIndexTask);

        const db = container.resolve(DynamoDBClient);
        const documentClient = db.client;

        const tableInstance = createTable({
            name: process.env.DB_TABLE as string,
            documentClient
        });
        const tableElasticsearchInstance = createOpenSearchTable({
            name: process.env.DB_TABLE_OPENSEARCH as string,
            documentClient
        });

        const groupEntity = createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance
        });
        const modelEntity = createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance
        });
        const entryEntity = createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance
        });
        const entriesEsEntity = createOpenSearchEntity({
            entityName: ENTITIES.ENTRIES_ES,
            table: tableElasticsearchInstance
        });

        // Register infrastructure instances (app-scoped)
        container.registerInstance(CmsDdbEsTable, tableInstance);
        container.registerInstance(CmsDdbEsOsTable, tableElasticsearchInstance);
        container.registerInstance(CmsDdbEsGroupEntity, groupEntity);
        container.registerInstance(CmsDdbEsModelEntity, modelEntity);
        container.registerInstance(CmsDdbEsEntryEntity, entryEntity);
        container.registerInstance(CmsDdbEsEntriesEsEntity, entriesEsEntity);

        // Register entities in DbRegistry (optional — may not be available in all contexts)
        try {
            const dbRegistry = container.resolve(DbRegistry);
            dbRegistry.register({
                item: entryEntity,
                app: "cms",
                tags: ["regular", entryEntity.name]
            });
            dbRegistry.register({
                item: entriesEsEntity,
                app: "cms",
                tags: ["es", entriesEsEntity.name]
            });
        } catch {
            // DbRegistry not registered — skip entity registration
        }

        // Group + model: DI classes, app-scoped singletons
        container.register(DdbEsGroupStorageOperations).inSingletonScope();
        container.register(DdbEsModelStorageOperations).inSingletonScope();

        // Entry storage operations: registers all per-method entry abstractions.
        DdbEsEntryStorageOpsFeature.register(container);
    }
});

/** @deprecated use HeadlessCmsDdbEsFeature instead */
export const registerCmsOpenSearchStorageOperations = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        return HeadlessCmsDdbEsFeature.register(context.container);
    });

    plugin.name = "cms.registerOpenSearchStorageOperations";

    return [plugin];
};
