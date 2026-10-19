export {
    GlobalKeyValueStore,
    KeyValueStore,
    KeyValueStoreRepository,
    KeyValueStorageOperations
} from "./abstractions.js";
export type { KeyValueComparable } from "./abstractions.js";

export {
    KeyNotFoundError,
    KeyValueStorageError,
    KeyValueInvalidCursorError,
    KeyValueInvalidCollectionError,
    KeyValueKeyTooLongError,
    KeyValueConditionFailedError,
    KeyValueInvalidConditionError
} from "./errors.js";
