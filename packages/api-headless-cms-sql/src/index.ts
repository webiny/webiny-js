import type { CmsContext } from "~/types.js";
import type { SqlStorageOperationsFactory } from "~/types.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { TableNameResolver } from "~/utils/TableNameResolver.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { Knex } from "knex";

const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { knex, plugins, tableNamePrefix } = params;

    const sharedTables = process.env.WEBINY_SHARED_TABLES === "true";

    const tableNameResolver = new TableNameResolver({
        sharedTables,
        tableNamePrefix
    });

    const groups = createGroupsStorageOperations({
        knex,
        tableNameResolver
    });

    const models = createModelsStorageOperations({
        knex,
        tableNameResolver
    });

    const entries = createEntriesStorageOperations({
        knex,
        tableNameResolver,
        plugins
    });

    return {
        name: "sql",
        beforeInit: async () => {
            /* No-op for now. */
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
    private readonly config: ISqlStorageOperationsConfig;

    constructor(config: ISqlStorageOperationsConfig) {
        this.config = config;
    }

    public async create(context: CmsContext) {
        return createSqlStorageOperations({
            knex: this.config.knex,
            plugins: context.plugins,
            container: context.container,
            tableNamePrefix: this.config.tableNamePrefix
        });
    }
}

export const registerSqlStorageOperations = (config: ISqlStorageOperationsConfig) => {
    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.sql",
        register: container => {
            container.registerFactory(StorageOperationsFactoryAbstraction, () => {
                return new SqlStorageOperationsFactoryImpl(config);
            });
        }
    });

    return [
        createRegisterExtensionPlugin(context => {
            return storageOperationsFeature.register(context.container);
        })
    ];
};
