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

export { HeadlessCmsDdbRequestFeature } from "~/requestFeature.js";

/**
 * Root half of the DynamoDB CMS storage: the table and entity definitions, built once per process.
 * The storage operations are per request, in `HeadlessCmsDdbRequestFeature`.
 * Requires DynamoDBClient to be registered in the container first (via DbFeature).
 *
 * Usage:
 *   DbFeature.register(container, { documentClient, table });
 *   HeadlessCmsDdbFeature.register(container);
 *   // then in request:
 *   HeadlessCmsDdbRequestFeature.register(requestContainer);
 *   HeadlessCmsFeature.register(requestContainer, { type: "manage" });
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
    }
});
