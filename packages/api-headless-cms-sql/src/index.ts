import type { CmsContext, SqlStorageOperationsFactory } from "~/types.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { KnexInstanceFeature } from "~/features/knexInstance/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";

const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { container, plugins } = params;

    const knex = container.resolve(KnexInstance);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entryTableManager = container.resolve(EntryTableManager);

    const groups = createGroupsStorageOperations(knex, tableNameResolver, groupSchemaManager);

    const models = createModelsStorageOperations(knex, tableNameResolver, modelSchemaManager);

    const entries = createEntriesStorageOperations({
        knex,
        entryTableManager,
        container,
        plugins
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
    tableNameSuffix?: string;
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
                tableNamePrefix: config.tableNamePrefix,
                tableNameSuffix: config.tableNameSuffix
            });

            KnexInstanceFeature.register(container, config.knex);
            TableNameResolverFeature.register(container);
            ValueFilterFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntryTableManagerFeature.register(container);

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
