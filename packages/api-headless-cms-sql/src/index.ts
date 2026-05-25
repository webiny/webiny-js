import type { CmsContext } from "~/types.js";
import type { SqlStorageOperationsFactory } from "~/types.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { TableNameResolverImpl } from "~/features/tableNameResolver/TableNameResolver.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { SchemaRegistryFeature } from "~/features/schemaRegistry/feature.js";
import { FieldTypeMapperFeature } from "~/features/fieldTypeMapper/feature.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntrySchemaManagerFeature } from "~/features/entrySchemaManager/feature.js";
import { GroupSchemaManagerAbstraction } from "~/features/groupSchemaManager/abstractions.js";
import { ModelSchemaManagerAbstraction } from "~/features/modelSchemaManager/abstractions.js";
import { EntrySchemaManagerAbstraction } from "~/features/entrySchemaManager/abstractions.js";
import { KnexInstanceAbstraction } from "~/features/knexInstance/abstractions.js";
import { TableNameResolverAbstraction } from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";

const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { plugins, container } = params;

    const knex = container.resolve(KnexInstanceAbstraction);
    const tableNameResolver = container.resolve(TableNameResolverAbstraction);
    const groupSchemaManager = container.resolve(GroupSchemaManagerAbstraction);
    const modelSchemaManager = container.resolve(ModelSchemaManagerAbstraction);
    const entrySchemaManager = container.resolve(EntrySchemaManagerAbstraction);

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
            knex: context.container.resolve(KnexInstanceAbstraction),
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
            container.registerFactory(KnexInstanceAbstraction, () => config.knex);
            container.registerInstance(TableNameResolverAbstraction, tableNameResolver);

            SchemaRegistryFeature.register(container);
            FieldTypeMapperFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntrySchemaManagerFeature.register(container);

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
