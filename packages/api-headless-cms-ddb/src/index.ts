import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import dynamoDbPlugins from "./dynamoDb";
import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { createSystemEntity } from "~/definitions/system";
import { createGroupEntity } from "~/definitions/group";
import { createModelEntity } from "~/definitions/model";
import { createEntryEntity } from "~/definitions/entry";
import { PluginsContainer } from "@webiny/plugins";
import { createSystemStorageOperations } from "~/operations/system";
import { createGroupsStorageOperations } from "~/operations/group";
import { createModelsStorageOperations } from "~/operations/model";
import { createEntriesStorageOperations } from "./operations/entry";

import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";
import {
    CmsEntryFieldFilterPathPlugin,
    CmsEntryFieldFilterPlugin,
    CmsEntryFieldSortingPlugin,
    CmsFieldFilterValueTransformPlugin
} from "~/plugins";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";

export * from "./plugins";

export const createStorageOperations: StorageOperationsFactory = params => {
    const { attributes, table, documentClient, plugins: userPlugins } = params;

    const tableInstance = createTable({
        table,
        documentClient
    });

    const entities = {
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        }),
        groups: createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.GROUPS] : {}
        }),
        models: createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.MODELS] : {}
        }),
        entries: createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.ENTRIES] : {}
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
                StorageTransformPlugin.type
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
        system: createSystemStorageOperations({
            entity: entities.system
        }),
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
