import { getProperty, setProperty, deleteProperty } from "dot-prop";

/**
 * Get a nested property value by dot-notation path.
 */
function immutableGet<T = unknown>(
    object: Record<string, any> | null | undefined,
    path: string,
    defaultValue?: T
): T {
    if (!object) {
        return defaultValue as T;
    }
    return getProperty(object, path, defaultValue) as T;
}

/**
 * Returns a deep clone with the value set at the given path.
 * If value is a function, it receives the current value and should return the new value.
 */
function immutableSet<T extends Record<string, any>>(
    object: T,
    path: string,
    value: unknown | ((current: any) => unknown)
): T {
    const clone = structuredClone(object);
    const finalValue = typeof value === "function" ? value(getProperty(clone, path)) : value;
    setProperty(clone, path, finalValue);
    return clone;
}

/**
 * Returns a deep clone with the property at the given path removed.
 */
function immutableDelete<T extends Record<string, any>>(object: T, path: string): T {
    const clone = structuredClone(object);
    deleteProperty(clone, path);
    return clone;
}

/**
 * Sets the value at the given path on the original object.
 */
function mutableSet<T extends Record<string, any>>(object: T, path: string, value: unknown): T {
    setProperty(object, path, value);
    return object;
}

/**
 * Removes the property at the given path from the original object.
 */
function mutableDelete<T extends Record<string, any>>(object: T, path: string): void {
    deleteProperty(object, path);
}

export { immutableGet, immutableSet, immutableDelete, mutableSet, mutableDelete };
