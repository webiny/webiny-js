import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Converts a file path to a valid ESM import specifier.
 * On Windows, absolute paths (e.g. "C:/...") must be file:// URLs for the ESM loader.
 */
export const toImportSpecifier = (inputPath: string): string => {
    return path.isAbsolute(inputPath) ? pathToFileURL(inputPath).href : inputPath;
};
