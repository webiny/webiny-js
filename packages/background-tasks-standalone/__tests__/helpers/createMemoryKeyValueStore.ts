import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyValueConditionFailedError } from "@webiny/api-core/features/keyValueStore/index.js";

interface IStoredRecord {
    value: unknown;
    expiresAt?: Date;
}

const isLive = (record: IStoredRecord | undefined): record is IStoredRecord => {
    if (!record) {
        return false;
    }
    return !record.expiresAt || record.expiresAt.getTime() > Date.now();
};

interface ICondition {
    exists?: boolean;
    equals?: unknown;
}

const conditionHolds = (current: IStoredRecord | undefined, condition: ICondition): boolean => {
    const live = isLive(current);
    if (condition.equals !== undefined) {
        return live && current.value === condition.equals;
    }
    return live === condition.exists;
};

/*
 * The global key-value store's conditions and expiry, kept in memory. The real stores are tested in
 * api-core; this only has to agree with them on what the claims rely on.
 */
export const createMemoryKeyValueStore = () => {
    const records = new Map<string, IStoredRecord>();
    const toKey = (key: string, scope?: string) => `${scope ?? "global"}:${key}`;

    const store: GlobalKeyValueStore.Interface = {
        async get<T>(key: string, options?: { scope?: string }) {
            const scopedKey = toKey(key, options?.scope);
            const record = records.get(scopedKey);
            if (!isLive(record)) {
                return Result.fail(new KeyNotFoundError(key));
            }
            return Result.ok(record.value as T);
        },
        async set(key, value, options) {
            const scopedKey = toKey(key, options?.scope);
            const current = records.get(scopedKey);
            const condition = options?.condition;
            if (condition && !conditionHolds(current, condition)) {
                return Result.fail(new KeyValueConditionFailedError(key));
            }
            records.set(scopedKey, { value, expiresAt: options?.expiresAt });
            return Result.ok();
        },
        async delete(key, options) {
            const scopedKey = toKey(key, options?.scope);
            const current = records.get(scopedKey);
            const condition = options?.condition;
            if (condition && !conditionHolds(current, condition)) {
                return Result.fail(new KeyValueConditionFailedError(key));
            }
            records.delete(scopedKey);
            return Result.ok();
        },
        async list() {
            return Result.ok({ items: [], cursor: null });
        }
    };

    return { store, records };
};
