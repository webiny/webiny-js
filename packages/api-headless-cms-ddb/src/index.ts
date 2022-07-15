import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import dynamoDbPlugins from "./dynamoDb";
import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemEntity } from "~/definitions/system";
import { createGroupEntity } from "~/definitions/group";
import { createModelEntity } from "~/definitions/model";
import { createEntryEntity } from "~/definitions/entry";
import { PluginsContainer } from "@webiny/plugins";
import { createSystemStorageOperations } from "~/operations/system";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createGroupsStorageOperations } from "~/operations/group";
import { createModelsStorageOperations } from "~/operations/model";
import { createEntriesStorageOperations } from "./operations/entry";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

export const createStorageOperations: StorageOperationsFactory = params => {
    const { attributes, table, documentClient, plugins: userPlugins } = params;

    const tableInstance = createTable({
        table,
        documentClient
    });

    const entities = {
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        }),
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
         * User defined custom plugins.
         */
        ...(userPlugins || []),
        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Field plugins for DynamoDB.
         */
        dynamoDbPlugins()
    ]);

    return {
        beforeInit: async context => {
            /**
             * Collect all required plugins from parent context.
             */
            const fieldPlugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
                "cms-model-field-to-graphql"
            );
            plugins.register(fieldPlugins);

            /**
             * Pass the plugins to the parent context.
             */
            context.plugins.register([dynamoDbPlugins()]);
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        system: createSystemStorageOperations({
            entity: entities.system
        }),
        settings: createSettingsStorageOperations({
            entity: entities.settings
        }),
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            plugins
        }),
        models: createModelsStorageOperations({
            entity: entities.models
        }),
        entries: createEntriesStorageOperations({
            entity: entities.entries,
            plugins
        })
    };
};
