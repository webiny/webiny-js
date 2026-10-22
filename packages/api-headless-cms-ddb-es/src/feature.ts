import { createTable, DynamoDBClient } from "@webiny/db-dynamodb";
import { ENTITIES } from "~/types.js";
import { createFeature } from "@webiny/feature/api/index.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch-aws";
import { FilterUtilFeature } from "@webiny/db-dynamodb/feature/FilterUtil/feature.js";
import { CmsDdbEsTable } from "~/abstractions/CmsDdbEsTable.js";
import { CmsDdbEsOsTable } from "~/abstractions/CmsDdbEsOsTable.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { CreateElasticsearchIndexTask } from "~/tasks/CreateElasticsearchIndexTask.js";
import { CmsEntitiesDbRegistryDecorator } from "~/registry/CmsEntitiesDbRegistryDecorator.js";
import { DdbEsGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { DdbEsModelStorageOpsFeature } from "~/operations/model/feature.js";
import { DdbEsEntryStorageOpsFeature } from "~/operations/entry/feature.js";

/**
 * DynamoDB+OpenSearch CMS storage. Register it once, in the root container. Tables and entities are
 * built once per process; the storage operations are transient, and per-request state (the entry
 * DataLoaders, the filter registries, the OpenSearch field indexes and model index cache) is
 * container scoped, so each request (child) container gets its own.
 */
export const HeadlessCmsDdbEsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        FilterUtilFeature.register(container);

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

        CmsEntryOpenSearchUtilsFeature.register(container);
        FilterRegistriesFeature.register(container);

        container.register(CreateElasticsearchIndexTask);

        // Adds the CMS entities to every request's DbRegistry, for the DDB to OpenSearch sync.
        container.registerDecorator(CmsEntitiesDbRegistryDecorator);

        DdbEsGroupStorageOpsFeature.register(container);
        DdbEsModelStorageOpsFeature.register(container);
        DdbEsEntryStorageOpsFeature.register(container);
    }
});
