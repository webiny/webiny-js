import { isValidObjectKey } from "./isValidObjectKey.js";

/*
 * Whether `key` is a valid storage key below `prefix`, which ends in `/`. The prefix itself does
 * not count: a key has to name something inside it.
 */
export const isKeyInsidePrefix = (key: string, prefix: string): boolean => {
    return isValidObjectKey(key) && key.startsWith(prefix) && key.length > prefix.length;
};
