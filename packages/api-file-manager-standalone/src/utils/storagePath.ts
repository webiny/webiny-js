import path from "node:path";

export const isPathContained = (filePath: string, storagePath: string): boolean => {
    const resolved = path.resolve(filePath);
    const root = path.resolve(storagePath);
    return resolved === root || resolved.startsWith(root + path.sep);
};

/**
 * Joins keys onto the root directory. Returns `undefined` when the result is the root itself or
 * points outside of it. Keys come from file records, which clients can write.
 */
export const getContainedPath = (root: string, ...keys: string[]): string | undefined => {
    const resolvedRoot = path.resolve(root);
    const filePath = path.resolve(resolvedRoot, ...keys.map(key => key.replace(/^[\\/]+/, "")));
    if (filePath === resolvedRoot || !isPathContained(filePath, resolvedRoot)) {
        return undefined;
    }
    return filePath;
};

/* Same as `getContainedPath`, but throws instead of returning `undefined`. */
export const resolveStoragePath = (root: string, ...keys: string[]): string => {
    const filePath = getContainedPath(root, ...keys);
    if (!filePath) {
        throw new Error("Refusing to access a path outside of the storage directory.");
    }
    return filePath;
};
