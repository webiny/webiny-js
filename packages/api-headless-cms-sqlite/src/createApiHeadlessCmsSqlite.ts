import { createFeature } from "@webiny/feature/api/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type {
    CmsContext,
    HeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { Database } from "@webiny/db-sqlite";
import { createGroupsStorageOperations } from "./operations/group/index.js";
import { createModelsStorageOperations } from "./operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";

const buildStorageOperations = (db: Database): HeadlessCmsStorageOperations => {
    const groups = createGroupsStorageOperations({ db });
    const models = createModelsStorageOperations({ db });
    const entries = createEntriesStorageOperations({ db });

    return {
        name: "sqlite",
        beforeInit: async () => {
            // Nothing yet. DDB clears its data loaders here.
        },
        groups,
        models,
        entries
    } as HeadlessCmsStorageOperations;
};

class SqliteStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public constructor(private readonly db: Database) {}

    public async create(_context: CmsContext): Promise<HeadlessCmsStorageOperations> {
        return buildStorageOperations(this.db);
    }
}

export interface RegisterSqliteCmsStorageOperationsParams {
    db: Database;
}

/**
 * Container-mode equivalent of `registerDynamoDbStorageOperations()` from
 * `@webiny/api-headless-cms-ddb`. Registers the SQLite-backed
 * `StorageOperationsFactory` in the DI container, which `createHeadlessCmsContext`
 * picks up at request time.
 */
export const registerSqliteCmsStorageOperations = (
    params: RegisterSqliteCmsStorageOperationsParams
) => {
    const { db } = params;

    return [
        createRegisterExtensionPlugin(context => {
            const factoryFeature = createFeature({
                name: "cms.storageOperations.sqlite",
                register: container => {
                    container.registerInstance(
                        StorageOperationsFactoryAbstraction,
                        new SqliteStorageOperationsFactoryImpl(db)
                    );
                }
            });
            factoryFeature.register(context.container);
        })
    ];
};
