/**
 * Compares two sort values in ascending order, the same way the DDB and SQL storage sort
 * entries: `null` and `undefined` sort last (so first in descending order), and an empty
 * string is a regular string. Strings are compared by code point, which keeps ISO dates in
 * chronological order.
 */
export function compareValues(a: unknown, b: unknown): number {
    const aEmpty = a === null || a === undefined;
    const bEmpty = b === null || b === undefined;
    if (aEmpty || bEmpty) {
        return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    }

    const left = a instanceof Date ? a.getTime() : a;
    const right = b instanceof Date ? b.getTime() : b;

    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    if (typeof left === "boolean" && typeof right === "boolean") {
        return Number(left) - Number(right);
    }

    const leftString = String(left);
    const rightString = String(right);
    return leftString < rightString ? -1 : leftString > rightString ? 1 : 0;
}
