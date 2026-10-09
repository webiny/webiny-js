import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createTable } from "~/definitions/table.js";
import { createFeature } from "@webiny/feature/api/index.js";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { FilterUtilFeature } from "@webiny/db-dynamodb/feature/FilterUtil/feature.js";
import { CmsDdbTable } from "~/abstractions/CmsDdbTable.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { DdbGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { DdbModelStorageOpsFeature } from "~/operations/model/feature.js";
import { DdbEntryStorageOpsFeature } from "~/operations/entry/feature.js";

/**
 * DynamoDB CMS storage. Register it once, in the root container. Tables and entities are built once
 * per process; the storage operations are transient, and per-request state (the entry DataLoaders,
 * the filter registries) is container scoped, so each request (child) container gets its own.
 * Requires DynamoDBClient to be registered in the container first (via DbFeature).
 */
export const HeadlessCmsDdbFeature = createFeature({
    name: "cms.storageOperations.ddb",
    register: container => {
        FilterUtilFeature.register(container);

        const db = container.resolve(DynamoDBClient);
        const documentClient = db.client;

        const tableInstance = createTable({ documentClient });

        // Register infrastructure instances (app-scoped)
        container.registerInstance(CmsDdbTable, tableInstance);
        container.registerInstance(
            CmsDdbGroupEntity,
            createGroupEntity({
                entityName: ENTITIES.GROUPS,
                table: tableInstance
            })
        );
        container.registerInstance(
            CmsDdbModelEntity,
            createModelEntity({
                entityName: ENTITIES.MODELS,
                table: tableInstance
            })
        );
        container.registerInstance(
            CmsDdbEntryEntity,
            createEntryEntity({
                entityName: ENTITIES.ENTRIES,
                table: tableInstance
            })
        );

        FilterRegistriesFeature.register(container);
        DdbGroupStorageOpsFeature.register(container);
        DdbModelStorageOpsFeature.register(container);
        DdbEntryStorageOpsFeature.register(container);
    }
});
