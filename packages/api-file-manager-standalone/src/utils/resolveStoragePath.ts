import { getContainedPath } from "./getContainedPath.js";

// Same as `getContainedPath`, but throws instead of returning `undefined`.
export const resolveStoragePath = (root: string, ...keys: string[]): string => {
    const filePath = getContainedPath(root, ...keys);
    if (!filePath) {
        throw new Error("Refusing to access a path outside of the storage directory.");
    }
    return filePath;
};
