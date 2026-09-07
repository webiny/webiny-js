import fs from "fs-extra";
import path from "path";

/**
 * Merges hosting-specific npm scripts into the generated project's `package.json`.
 *
 * The base template ships an empty `scripts` block because the useful shortcuts differ per hosting
 * type — e.g. self-hosted can watch everything with a single command, while AWS watches each app
 * against its own cloud environment.
 */
export const addProjectScripts = (
    projectRootFolderPath: string,
    scripts: Record<string, string>
) => {
    const pkgPath = path.join(projectRootFolderPath, "package.json");
    const pkg = fs.readJsonSync(pkgPath);

    pkg.scripts = {
        ...pkg.scripts,
        ...scripts
    };

    fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
};
