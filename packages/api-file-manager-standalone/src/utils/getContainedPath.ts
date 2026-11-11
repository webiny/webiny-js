import path from "node:path";
import { isPathContained } from "./isPathContained.js";

const stripLeadingSlashes = (key: string) => {
    return key.replace(/^[\\/]+/, "");
};

/*
 * Joins keys onto the root directory. Returns `undefined` when the result is the root itself or
 * points outside of it. Keys come from file records, which clients can write.
 */
export const getContainedPath = (root: string, ...keys: string[]): string | undefined => {
    const resolvedRoot = path.resolve(root);
    const relativeKeys = keys.map(stripLeadingSlashes);
    const filePath = path.resolve(resolvedRoot, ...relativeKeys);
    if (filePath === resolvedRoot || !isPathContained(filePath, resolvedRoot)) {
        return undefined;
    }
    return filePath;
};
