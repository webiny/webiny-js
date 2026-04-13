import { getProperty, setProperty, deleteProperty } from "dot-prop";

/**
 * Get a nested property value by dot-notation path.
 */
function immutableGet<T = unknown>(
    object: Record<string, unknown>,
    path: string,
    defaultValue?: T
): T {
    return getProperty(object, path, defaultValue) as T;
}

/**
 * Returns a deep clone with the value set at the given path.
 */
function immutableSet<T extends Record<string, unknown>>(
    object: T,
    path: string,
    value: unknown
): T {
    const clone = structuredClone(object);
    setProperty(clone, path, value);
    return clone;
}

/**
 * Returns a deep clone with the property at the given path removed.
 */
function immutableDelete<T extends Record<string, unknown>>(object: T, path: string): T {
    const clone = structuredClone(object);
    deleteProperty(clone, path);
    return clone;
}

/**
 * Removes the property at the given path from the original object.
 */
function mutableDelete<T extends Record<string, unknown>>(object: T, path: string): void {
    deleteProperty(object, path);
}

export { immutableGet, immutableSet, immutableDelete, mutableDelete };
