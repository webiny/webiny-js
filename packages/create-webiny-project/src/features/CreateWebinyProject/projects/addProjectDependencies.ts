import fs from "fs-extra";
import path from "path";

/**
 * Merges flavour-specific dependencies into the generated project's `package.json`.
 *
 * The base template's `package.json` is flavour-neutral (only shared deps like `webiny`, `react` and
 * `@webiny/mcp`); each flavour setup injects its own packages here. Values can be `"latest"` — the
 * later `SetWebinyPackageVersions` step rewrites every `@webiny/*` / `webiny` entry to the actual CWP
 * version, so only the presence of the dependency matters at this point.
 */
export const addProjectDependencies = (
    projectRootFolderPath: string,
    dependencies: Record<string, string>
) => {
    const pkgPath = path.join(projectRootFolderPath, "package.json");
    const pkg = fs.readJsonSync(pkgPath);

    pkg.dependencies = {
        ...pkg.dependencies,
        ...dependencies
    };

    // Keep dependencies sorted, matching the base template's alphabetical ordering.
    pkg.dependencies = Object.fromEntries(
        Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b))
    );

    fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
};
