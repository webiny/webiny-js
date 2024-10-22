import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import { PluginsContainer } from "@webiny/plugins";
import {
    CompressionPlugin,
    ElasticsearchQueryBuilderOperatorPlugin
} from "@webiny/api-elasticsearch";

import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex";

import { createCategoryEntity } from "~/definitions/categoryEntity";
import { createCategoryDynamoDbFields } from "~/operations/category/fields";
import { createCategoryStorageOperations } from "~/operations/category";

import { createMenuEntity } from "~/definitions/menuEntity";
import { createMenuDynamoDbFields } from "~/operations/menu/fields";
import { createMenuStorageOperations } from "~/operations/menu";

import { createPageElementEntity } from "~/definitions/pageElementEntity";
import { createPageElementDynamoDbFields } from "~/operations/pageElement/fields";
import { createPageElementStorageOperations } from "~/operations/pageElement";

import { createSettingsEntity } from "~/definitions/settingsEntity";
import { createSettingsStorageOperations } from "~/operations/settings";

import { createSystemEntity } from "~/definitions/systemEntity";
import { createSystemStorageOperations } from "~/operations/system";

import { createPageEntity } from "~/definitions/pageEntity";
import {
    createPagesDynamoDbFields,
    createPagesElasticsearchFields
} from "~/operations/pages/fields";
import { createPageStorageOperations } from "~/operations/pages";
import { createPageElasticsearchEntity } from "~/definitions/pageElasticsearchEntity";

import { createBlockCategoryEntity } from "~/definitions/blockCategoryEntity";
import { createBlockCategoryDynamoDbFields } from "~/operations/blockCategory/fields";
import { createBlockCategoryStorageOperations } from "~/operations/blockCategory";

import { createPageBlockEntity } from "~/definitions/pageBlockEntity";
import { createPageBlockDynamoDbFields } from "~/operations/pageBlock/fields";
import { createPageBlockStorageOperations } from "~/operations/pageBlock";

import { createPageTemplateEntity } from "~/definitions/pageTemplateEntity";
import { createPageTemplateDynamoDbFields } from "~/operations/pageTemplate/fields";
import { createPageTemplateStorageOperations } from "~/operations/pageTemplate";

import { PbContext } from "@webiny/api-page-builder/types";
import {
    BlockCategoryDynamoDbElasticFieldPlugin,
    CategoryDynamoDbElasticFieldPlugin,
    IndexPageDataPlugin,
    MenuDynamoDbElasticFieldPlugin,
    PageBlockDynamoDbFieldPlugin,
    PageDynamoDbElasticsearchFieldPlugin,
    PageElasticsearchBodyModifierPlugin,
    PageElasticsearchFieldPlugin,
    PageElasticsearchIndexPlugin,
    PageElasticsearchQueryModifierPlugin,
    PageElasticsearchSortModifierPlugin,
    PageElementDynamoDbElasticFieldPlugin,
    SearchLatestPagesPlugin,
    SearchPagesPlugin,
    SearchPublishedPagesPlugin
} from "./plugins";
import { createIndexTaskPlugin } from "~/tasks/createIndexTaskPlugin";

export * from "./plugins";

export const createStorageOperations: StorageOperationsFactory = params => {
    const {
        documentClient,
        elasticsearch,
        table,
        esTable,
        attributes,
        plugins: userPlugins
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
        createPagesElasticsearchFields(),
        /**
         * Page fields required for filtering/sorting when using dynamodb.
         */
        createPagesDynamoDbFields(),
        /**
         * Built-in Elasticsearch index templates
         */
        elasticsearchIndexPlugins(),
        /**
         * Block Category fields required for filtering/sorting.
         */
        createBlockCategoryDynamoDbFields(),
        /**
         * Page Block fields required for filtering/sorting.
         */
        createPageBlockDynamoDbFields(),
        /**
         * Page Template fields required for filtering/sorting.
         */
        createPageTemplateDynamoDbFields()
    ]);

    const entities = {
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table: tableInstance
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
        }),
        blockCategories: createBlockCategoryEntity({
            entityName: ENTITIES.BLOCK_CATEGORIES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.BLOCK_CATEGORIES] : {}
        }),
        pageBlocks: createPageBlockEntity({
            entityName: ENTITIES.PAGE_BLOCKS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.PAGE_BLOCKS] : {}
        }),
        pageTemplates: createPageTemplateEntity({
            entityName: ENTITIES.PAGE_TEMPLATES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.PAGE_TEMPLATES] : {}
        })
    };

    const categories = createCategoryStorageOperations({
        entity: entities.categories,
        plugins
    });
    const blockCategories = createBlockCategoryStorageOperations({
        entity: entities.blockCategories,
        plugins
    });
    const pageBlocks = createPageBlockStorageOperations({
        entity: entities.pageBlocks,
        plugins
    });
    const pageTemplates = createPageTemplateStorageOperations({
        entity: entities.pageTemplates,
        plugins
    });

    return {
        beforeInit: async (context: PbContext) => {
            context.db.registry.register({
                item: entities.pages,
                app: "pb",
                tags: ["regular"]
            });
            context.db.registry.register({
                item: entities.pagesEs,
                app: "pb",
                tags: ["es"]
            });
            const types: string[] = [
                // Elasticsearch
                CompressionPlugin.type,
                ElasticsearchQueryBuilderOperatorPlugin.type,
                // Page Builder
                BlockCategoryDynamoDbElasticFieldPlugin.type,
                CategoryDynamoDbElasticFieldPlugin.type,
                IndexPageDataPlugin.type,
                MenuDynamoDbElasticFieldPlugin.type,
                PageBlockDynamoDbFieldPlugin.type,
                PageDynamoDbElasticsearchFieldPlugin.type,
                PageElasticsearchBodyModifierPlugin.type,
                PageElasticsearchFieldPlugin.type,
                PageElasticsearchIndexPlugin.type,
                PageElasticsearchQueryModifierPlugin.type,
                PageElasticsearchSortModifierPlugin.type,
                PageElementDynamoDbElasticFieldPlugin.type,
                SearchLatestPagesPlugin.type,
                SearchPagesPlugin.type,
                SearchPublishedPagesPlugin.type
            ];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
            pageTemplates.dataLoader.clear();
            pageBlocks.dataLoader.clear();
            blockCategories.dataLoader.clear();
            categories.dataLoader.clear();

            context.plugins.register([createIndexTaskPlugin(), elasticsearchIndexPlugins()]);
        },
        init: async (context: PbContext) => {
            context.i18n.locales.onLocaleBeforeCreate.subscribe(async ({ locale, tenant }) => {
                await createElasticsearchIndex({
                    elasticsearch,
                    plugins,
                    locale: locale.code,
                    tenant
                });
            });
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
        system: createSystemStorageOperations({
            entity: entities.system
        }),
        settings: createSettingsStorageOperations({
            entity: entities.settings
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
        }),
        categories,
        blockCategories,
        pageBlocks,
        pageTemplates
    };
};
