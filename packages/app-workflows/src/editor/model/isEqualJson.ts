import { isRecord } from "./isRecord.js";

const isEqualArrays = (left: unknown[], right: unknown[]): boolean => {
    if (left.length !== right.length) {
        return false;
    }
    return left.every((item, index) => isEqualJson(item, right[index]));
};

const isEqualRecords = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
    const leftKeys = Object.keys(left);
    if (leftKeys.length !== Object.keys(right).length) {
        return false;
    }
    return leftKeys.every(key => {
        return (
            Object.prototype.hasOwnProperty.call(right, key) && isEqualJson(left[key], right[key])
        );
    });
};

/*
 * Deep equality of JSON values that ignores the key order of objects. The draft compares a step's
 * untyped `config` with the stored one: a form may rebuild the same config with its keys in
 * another order, which must not count as a change.
 */
export const isEqualJson = (left: unknown, right: unknown): boolean => {
    if (left === right) {
        return true;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        return isEqualArrays(left, right);
    }
    if (isRecord(left) && isRecord(right)) {
        return isEqualRecords(left, right);
    }
    return false;
};
