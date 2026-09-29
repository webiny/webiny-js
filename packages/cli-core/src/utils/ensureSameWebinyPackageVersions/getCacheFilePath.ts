import path from "path";
import { findUpSync } from "find-up";

const CACHE_FILE_NAME = "package-versions-check.json";

/*
 * Locates `.webiny/package-versions-check.json` for the project the CLI was invoked in.
 *
 * The version check runs before the CLI has a DI container, so this cannot go through
 * `LocalStorageService`. It finds the project root the same way `GetProjectService` does, by walking
 * up to `webiny.config.tsx`, so both agree on which project is being written to. Returns null outside
 * a project, where there is nowhere to cache.
 */
export const getCacheFilePath = (): string | null => {
    const webinyConfigFilePath = findUpSync("webiny.config.tsx");
    if (!webinyConfigFilePath) {
        return null;
    }

    const projectRootFolderPath = path.dirname(webinyConfigFilePath);

    return path.join(projectRootFolderPath, ".webiny", CACHE_FILE_NAME);
};
