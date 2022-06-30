import * as fs from "fs";
import * as path from "path";

/**
 * Made for backwards compatibility. We want to distinguish between projects with the `code`
 * folder and projects without it (`code` folder was removed in Webiny v5.29.0).
 */
export const projectHasCodeFolders = (projectRootPath: string): boolean => {
    // In order to determine this, we can just check if `api/code` code exists.
    return fs.existsSync(path.join(projectRootPath, "api", "code"));
};
