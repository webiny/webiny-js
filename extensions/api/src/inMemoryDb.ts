import { Db, type DbDriver } from "@webiny/db";
import type {
    GetValueResult,
    GetValuesResult,
    IListValuesParams,
    ListValuesResult,
    RemoveValueResult,
    RemoveValuesResult,
    StorageKey,
    StoreValueResult,
    StoreValuesResult
} from "@webiny/db/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { Context } from "@webiny/handler/types.js";

type GenericRecord<K extends string = string, V = unknown> = Record<K, V>;

interface DbContext extends Context {
    db?: Db<unknown>;
}

/**
 * Process-local in-memory `IStore` driver. Backs `context.db` for the
 * container POC where Webiny features (api-headless-cms-tasks's
 * deleteModel CRUD, sync-system, etc.) expect a `context.db.store`
 * even though the container path doesn't actually exercise those
 * code paths.
 *
 * Without it, `isBeingDeleted` on every CmsContentModel throws
 * (its resolver catches the throw and falls back to `true`), so
 * freshly-created models look "being deleted" in the Admin UI.
 *
 * Single-process scope; goes away with the container. Acceptable for
 * the POC because none of the features that write to it actually run
 * yet (deleteModelTask is dispatched via background tasks which the
 * container deferred).
 */
class InMemoryDriver implements DbDriver<null> {
    private readonly store = new Map<string, unknown>();

    public getClient(): null {
        return null;
    }

    public async storeValue<V>(key: StorageKey, value: V): Promise<StoreValueResult<V>> {
        this.store.set(key, value);
        return { key, data: value };
    }

    public async storeValues<V extends GenericRecord<StorageKey>>(
        values: V
    ): Promise<StoreValuesResult<V>> {
        for (const [k, v] of Object.entries(values)) {
            this.store.set(k, v);
        }
        return { keys: Object.keys(values) as (keyof V)[], data: values };
    }

    public async getValue<V>(key: StorageKey): Promise<GetValueResult<V>> {
        return { key, data: (this.store.get(key) as V) ?? null };
    }

    public async getValues<V extends GenericRecord<StorageKey>>(
        keys: (keyof V)[]
    ): Promise<GetValuesResult<V>> {
        const data = {} as V;
        for (const key of keys) {
            (data as GenericRecord<StorageKey>)[key as StorageKey] = (this.store.get(
                key as string
            ) ?? null) as V[keyof V];
        }
        return { keys, data };
    }

    public async listValues<V extends GenericRecord<StorageKey>>(
        params?: IListValuesParams
    ): Promise<ListValuesResult<V>> {
        const allKeys = Array.from(this.store.keys());
        const filtered = filterKeys(allKeys, params);
        const data = {} as V;
        const keys: StorageKey[] = [];
        for (const key of filtered) {
            (data as GenericRecord<StorageKey>)[key as StorageKey] = this.store.get(
                key
            ) as V[keyof V];
            keys.push(key as StorageKey);
        }
        return { keys: keys as (keyof V)[], data };
    }

    public async removeValue<V>(key: StorageKey): Promise<RemoveValueResult<V>> {
        const previous = this.store.get(key) as V | undefined;
        this.store.delete(key);
        return { key, data: previous ?? null };
    }

    public async removeValues<V extends GenericRecord<StorageKey>>(
        keys: (keyof V)[]
    ): Promise<RemoveValuesResult<V>> {
        for (const key of keys) {
            this.store.delete(key as string);
        }
        return { keys };
    }
}

const filterKeys = (keys: string[], params?: IListValuesParams): string[] => {
    if (!params) {
        return keys;
    }
    if ("beginsWith" in params) {
        return keys.filter(k => k.startsWith(params.beginsWith));
    }
    if ("eq" in params) {
        return keys.filter(k => k === params.eq);
    }
    if ("gt" in params) {
        return keys.filter(k => k > params.gt);
    }
    if ("gte" in params) {
        return keys.filter(k => k >= params.gte);
    }
    if ("lt" in params) {
        return keys.filter(k => k < params.lt);
    }
    if ("lte" in params) {
        return keys.filter(k => k <= params.lte);
    }
    return keys;
};

export const createInMemoryDb = () => {
    return createRegisterExtensionPlugin<DbContext>(async context => {
        if (context.db) {
            return;
        }
        context.db = new Db({ driver: new InMemoryDriver() });
    });
};
