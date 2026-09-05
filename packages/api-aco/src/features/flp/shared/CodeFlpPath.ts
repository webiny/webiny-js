import { ROOT_FOLDER } from "@webiny/shared-aco";

interface ParsedPath {
    /** Normalized path, without the wildcard suffix, e.g. `root/marketing`. */
    base: string;
    /** Whether the rule was written with a trailing `/*`, meaning "this folder and its subtree". */
    subtree: boolean;
}

/**
 * Folder paths are stored as `root/<slug>[/<slug>...]` (see `~/utils/Path.ts`). Code-defined FLPs
 * are authored by hand, so we accept the friendlier `/marketing` form as well and normalize it.
 */
export class CodeFlpPath {
    static parse(path: string): ParsedPath {
        let value = path.trim();
        let subtree = false;

        // A trailing "*" (with or without the separator) means "this folder and everything below".
        if (value.endsWith("*")) {
            subtree = true;
            value = value.slice(0, -1);
        }

        // Strip surrounding separators, so "/marketing/" and "marketing" normalize the same way.
        value = value.replace(/^\/+/, "").replace(/\/+$/, "");

        if (value === ROOT_FOLDER || value === "") {
            return { base: ROOT_FOLDER, subtree: value === "" ? true : subtree };
        }

        // The "root" prefix is an implementation detail of stored paths — make it optional.
        const base = value.startsWith(`${ROOT_FOLDER}/`) ? value : `${ROOT_FOLDER}/${value}`;

        return { base, subtree };
    }

    static matches(rulePath: string, folderPath: string): boolean {
        const { base, subtree } = CodeFlpPath.parse(rulePath);

        if (folderPath === base) {
            return true;
        }

        return subtree ? folderPath.startsWith(`${base}/`) : false;
    }
}
