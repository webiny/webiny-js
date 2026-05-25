import type { CmsContext } from "~/types.js";
import type { SqlStorageOperationsFactory } from "~/types.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { TableNameResolverImpl } from "~/utils/TableNameResolver.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { SchemaFeature } from "~/schema/feature.js";
import { GroupSchemaManager } from "~/schema/abstractions.js";
import { ModelSchemaManager } from "~/schema/abstractions.js";
import { EntrySchemaManager } from "~/schema/abstractions.js";
import { KnexInstance } from "~/schema/KnexInstance.js";
import { TableNameResolver } from "~/schema/TableNameResolver.js";
import type { Knex } from "knex";

const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { plugins, container } = params;

    const knex = container.resolve(KnexInstance);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entrySchemaManager = container.resolve(EntrySchemaManager);

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
    const sharedTables = process.env.WEBINY_SHARED_TABLES === "true";

    const tableNameResolver = new TableNameResolverImpl({
        sharedTables,
        tableNamePrefix: config.tableNamePrefix
    });

    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.sql",
        register: container => {
            container.registerFactory(KnexInstance, () => config.knex);
            container.registerInstance(TableNameResolver, tableNameResolver);

            SchemaFeature.register(container);

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
