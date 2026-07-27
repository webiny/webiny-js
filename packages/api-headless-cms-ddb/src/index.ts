import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { createTable } from "~/definitions/table.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { FilterUtilFeature } from "@webiny/db-dynamodb/feature/FilterUtil/feature.js";
import { CmsDdbTable } from "~/abstractions/CmsDdbTable.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { DdbGroupStorageOperations } from "~/operations/group/DdbGroupStorageOperations.js";
import { DdbModelStorageOperations } from "~/operations/model/DdbModelStorageOperations.js";
import { DdbEntryStorageOpsFeature } from "~/DdbEntryStorageOpsFeature.js";

/**
 * DI-native feature — registers the DynamoDB CMS storage operations directly via the DI container.
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

        // Group + model: DI classes, app-scoped singletons
        container.register(DdbGroupStorageOperations).inSingletonScope();
        container.register(DdbModelStorageOperations).inSingletonScope();

        // Entry ops: 22 per-method DI classes + DataLoaders
        DdbEntryStorageOpsFeature.register(container);
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
