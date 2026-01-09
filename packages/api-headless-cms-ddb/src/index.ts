import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters/index.js";
import dynamoDbPlugins from "./dynamoDb/index.js";
import type { StorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createTable } from "~/definitions/table.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { PluginsContainer } from "@webiny/plugins";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";

import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins/index.js";
import {
    CmsEntryFieldFilterPathPlugin,
    CmsEntryFieldFilterPlugin,
    CmsEntryFieldSortingPlugin,
    CmsFieldFilterValueTransformPlugin
} from "~/plugins/index.js";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin.js";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";
import { CompressorPlugin } from "@webiny/api";

export * from "./plugins/index.js";

export const createStorageOperations: StorageOperationsFactory = params => {
    const { table, documentClient, plugins: userPlugins } = params;

    const tableInstance = createTable({
        table,
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

    const plugins = new PluginsContainer([
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
        createFilterCreatePlugins(),
        /**
         * User defined custom plugins.
         */
        ...(userPlugins || [])
    ]);

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        plugins
    });

    return {
        name: "dynamodb",
        beforeInit: async context => {
            const types: string[] = [
                "cms-model-field-to-graphql",
                CmsEntryFieldFilterPathPlugin.type,
                CmsFieldFilterValueTransformPlugin.type,
                CmsEntryFieldFilterPlugin.type,
                CmsEntryFieldSortingPlugin.type,
                ValueFilterPlugin.type,
                StorageOperationsCmsModelPlugin.type,
                StorageTransformPlugin.type,
                CompressorPlugin.type
            ];
            /**
             * Collect all required plugins from parent context.
             */
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
            /**
             * Pass the plugins to the parent context.
             */
            context.plugins.register([dynamoDbPlugins()]);

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
