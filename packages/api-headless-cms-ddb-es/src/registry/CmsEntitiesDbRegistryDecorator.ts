import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";

/**
 * DbRegistry is container scoped, so every request (child) container gets its own registry. This
 * decorator is registered once in the root and runs for each new registry, registering the CMS
 * entities the DDB to OpenSearch sync stages.
 */
class CmsEntitiesDbRegistryDecoratorImpl implements DbRegistry.Interface {
    public constructor(
        entryEntity: CmsDdbEsEntryEntity.Interface,
        entriesEsEntity: CmsDdbEsEntriesEsEntity.Interface,
        private readonly decoratee: DbRegistry.Interface
    ) {
        decoratee.register({
            item: entryEntity,
            app: "cms",
            tags: ["regular", entryEntity.name]
        });
        decoratee.register({
            item: entriesEsEntity,
            app: "cms",
            tags: ["es", entriesEsEntity.name]
        });
    }

    public register<T = unknown>(params: DbRegistry.RegisterParams<T>): void {
        this.decoratee.register(params);
    }

    public getOneItem<T = unknown>(
        cb: (item: DbRegistry.RegistryItem<T>) => boolean
    ): DbRegistry.RegistryItem<T> {
        return this.decoratee.getOneItem(cb);
    }

    public getItem<T = unknown>(
        cb: (item: DbRegistry.RegistryItem<T>) => boolean
    ): DbRegistry.RegistryItem<T> | null {
        return this.decoratee.getItem(cb);
    }

    public getItems<T = unknown>(
        cb: (item: DbRegistry.RegistryItem<T>) => boolean
    ): DbRegistry.RegistryItem<T>[] {
        return this.decoratee.getItems(cb);
    }
}

export const CmsEntitiesDbRegistryDecorator = DbRegistry.createDecorator({
    decorator: CmsEntitiesDbRegistryDecoratorImpl,
    dependencies: [CmsDdbEsEntryEntity, CmsDdbEsEntriesEsEntity]
});
