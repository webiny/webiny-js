import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";

/**
 * Adds the CMS entities to every request's DbRegistry.
 *
 * DbRegistry is container scoped: each request (child) container builds its own, empty registry. The
 * DDB to OpenSearch sync looks up two CMS entities in it (the DynamoDB entries entity and the
 * OpenSearch entries entity), so every one of those registries needs them.
 *
 * The CMS storage feature runs once, in the root, before any request exists, so it can't register into
 * per-request registries directly. Instead it registers this decorator in the root. Decorators on a
 * container-scoped registration apply to every instance as it is built, so this constructor runs once
 * per request registry and adds the two entities. Every other call passes through to the registry.
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
