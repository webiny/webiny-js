import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import { createSystemStorageOperations } from "~/operations/system";
import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { createSettingsEntity } from "~/definitions/settingsEntity";
import { createSystemEntity } from "./definitions/systemEntity";
import { createCategoryEntity } from "~/definitions/categoryEntity";
import { createMenuEntity } from "~/definitions/menuEntity";
import { createPageElementEntity } from "~/definitions/pageElementEntity";
import { createPageEntity } from "~/definitions/pageEntity";
import { createPageElasticsearchEntity } from "~/definitions/pageElasticsearchEntity";
import { PluginsContainer } from "@webiny/plugins";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch/operators";
import { execOnBeforeInstall } from "~/operations/system/installation";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createCategoryDynamoDbFields } from "~/operations/category/fields";
import { createCategoryStorageOperations } from "~/operations/category";
import { createMenuDynamoDbFields } from "~/operations/menu/fields";
import { createMenuStorageOperations } from "~/operations/menu";
import { createPageElementDynamoDbFields } from "~/operations/pageElement/fields";
import { createPageElementStorageOperations } from "~/operations/pageElement";
import {
    createPagesElasticsearchFields,
    createPagesDynamoDbFields
} from "~/operations/pages/fields";
import { createPageStorageOperations } from "~/operations/pages";

export const createStorageOperations: StorageOperationsFactory = params => {
    const {
        documentClient,
        elasticsearch,
        table,
        esTable,
        attributes,
        plugins: customPlugins
    } = params;

    const tableInstance = createTable({
        table,
        documentClient
    });
    const tableElasticsearchInstance = createElasticsearchTable({
        table: esTable,
        documentClient
    });

    const plugins = new PluginsContainer([
        /**
         * User defined custom plugins.
         */
        ...(customPlugins || []),
        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Elasticsearch operators.
         */
        getElasticsearchOperators(),
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
        createPagesElasticsearchFields(),
        /**
         * Page fields required for filtering/sorting when using dynamodb.
         */
        createPagesDynamoDbFields()
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
        }),
        pagesEs: createPageElasticsearchEntity({
            entityName: ENTITIES.PAGES_ES,
            table: tableElasticsearchInstance,
            attributes: attributes ? attributes[ENTITIES.PAGES_ES] : {}
        })
    };

    return {
        init: async context => {
            context.pageBuilder.onBeforeInstall.subscribe(async ({ tenant }) => {
                await execOnBeforeInstall({
                    tenant,
                    elasticsearch
                });
            });
        },
        plugins: [],
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
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
            esEntity: entities.pagesEs,
            elasticsearch,
            plugins
        })
    };
};
