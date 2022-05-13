import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { PluginsContainer } from "@webiny/plugins";
import { createCategoryDynamoDbFields } from "~/operations/category/fields";
import { createMenuDynamoDbFields } from "~/operations/menu/fields";
import { createPageElementDynamoDbFields } from "~/operations/pageElement/fields";
import { createSettingsEntity } from "~/definitions/settingsEntity";
import { createSystemEntity } from "~/definitions/systemEntity";
import { createCategoryEntity } from "~/definitions/categoryEntity";
import { createMenuEntity } from "~/definitions/menuEntity";
import { createPageElementEntity } from "~/definitions/pageElementEntity";
import { createPageEntity } from "~/definitions/pageEntity";
import { createSystemStorageOperations } from "~/operations/system";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createCategoryStorageOperations } from "~/operations/category";
import { createMenuStorageOperations } from "~/operations/menu";
import { createPageElementStorageOperations } from "~/operations/pageElement";
import { createPageFields } from "~/operations/pages/fields";
import { createPageStorageOperations } from "~/operations/pages";

export const createStorageOperations: StorageOperationsFactory = params => {
    const { documentClient, table, attributes, plugins: userPlugins } = params;

    const tableInstance = createTable({
        table,
        documentClient
    });

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
         * Category fields required for filtering/sorting.
         */
        createCategoryDynamoDbFields(),
        /**
         * Menu fields required for filtering/sorting.
         */
        createMenuDynamoDbFields(),
        /**
         * Page element fields required for filtering/sorting.
         */
        createPageElementDynamoDbFields(),
        /**
         * Page fields required for filtering/sorting.
         */
        createPageFields()
    ]);

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
        categories: createCategoryEntity({
            entityName: ENTITIES.CATEGORIES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.CATEGORIES] : {}
        }),
        menus: createMenuEntity({
            entityName: ENTITIES.MENUS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.MENUS] : {}
        }),
        pageElements: createPageElementEntity({
            entityName: ENTITIES.PAGE_ELEMENTS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.PAGE_ELEMENTS] : {}
        }),
        pages: createPageEntity({
            entityName: ENTITIES.PAGES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.PAGES] : {}
        })
    };

    return {
        getEntities: () => entities,
        getTable: () => tableInstance,
        system: createSystemStorageOperations({
            entity: entities.system
        }),
        settings: createSettingsStorageOperations({
            entity: entities.settings
        }),
        categories: createCategoryStorageOperations({
            entity: entities.categories,
            plugins
        }),
        menus: createMenuStorageOperations({
            entity: entities.menus,
            plugins
        }),
        pageElements: createPageElementStorageOperations({
            entity: entities.pageElements,
            plugins
        }),
        pages: createPageStorageOperations({
            entity: entities.pages,
            plugins
        })
    };
};
