import type { CmsContext, SqlStorageOperationsFactory } from "~/types.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { SchemaRegistryFeature } from "~/features/schemaRegistry/feature.js";
import { FieldTypeMapperFeature } from "~/features/fieldTypeMapper/feature.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntrySchemaManagerFeature } from "~/features/entrySchemaManager/feature.js";
import { SqlOperatorFeature } from "~/features/sqlOperator/feature.js";
import { SqlEntryFilterFeature } from "~/features/sqlEntryFilter/feature.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { EntrySchemaManager } from "~/features/entrySchemaManager/abstractions.js";
import { SqlOperatorRegistry } from "~/features/sqlOperator/abstractions/index.js";
import { SqlEntryFilterRegistry } from "~/features/sqlEntryFilter/abstractions/index.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import {
    TableNameResolver,
    TableNameResolverConfig
} from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { KnexInstanceFeature } from "~/features/knexInstance/feature.js";

const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { container } = params;

    const knex = container.resolve(KnexInstance);
    const tableNameResolver = container.resolve(TableNameResolver);
    const tableNameResolverConfig = container.resolve(TableNameResolverConfig);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entrySchemaManager = container.resolve(EntrySchemaManager);
    const operatorRegistry = container.resolve(SqlOperatorRegistry);
    const filterRegistry = container.resolve(SqlEntryFilterRegistry);

    const groups = createGroupsStorageOperations(knex, tableNameResolver, groupSchemaManager);

    const models = createModelsStorageOperations(
        knex,
        tableNameResolver,
        modelSchemaManager,
        entrySchemaManager
    );

    const entries = createEntriesStorageOperations({
        knex,
        tableNameResolver,
        entrySchemaManager,
        operatorRegistry,
        filterRegistry,
        sharedTables: tableNameResolverConfig.sharedTables
    });

    return {
        name: "sql",
        beforeInit: async () => {
            /* Schema managers handle table creation lazily on first access. */
        },
        groups,
        models,
        entries
    };
};

interface ISqlStorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

class SqlStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public async create(context: CmsContext) {
        return createSqlStorageOperations({
            knex: context.container.resolve(KnexInstance),
            plugins: context.plugins,
            container: context.container
        });
    }
}

export const registerSqlStorageOperations = (config: ISqlStorageOperationsConfig) => {
    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.sql",
        register: container => {
            const sharedTables = process.env.WEBINY_SHARED_TABLES === "true";

            container.registerInstance(TableNameResolverConfig, {
                sharedTables,
                tableNamePrefix: config.tableNamePrefix
            });

            KnexInstanceFeature.register(container, config.knex);
            TableNameResolverFeature.register(container);
            SchemaRegistryFeature.register(container);
            FieldTypeMapperFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntrySchemaManagerFeature.register(container);
            SqlOperatorFeature.register(container);
            SqlEntryFilterFeature.register(container);

            container.registerFactory(StorageOperationsFactoryAbstraction, () => {
                return new SqlStorageOperationsFactoryImpl();
            });
        }
    });

    return [
        createRegisterExtensionPlugin(context => {
            return storageOperationsFeature.register(context.container);
        })
    ];
};
