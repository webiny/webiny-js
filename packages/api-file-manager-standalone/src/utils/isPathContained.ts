import path from "node:path";

export const isPathContained = (filePath: string, storagePath: string): boolean => {
    const resolved = path.resolve(filePath);
    const root = path.resolve(storagePath);
    return resolved === root || resolved.startsWith(root + path.sep);
};
