import { dirname, join, relative, resolve } from "node:path";
import fg from "fast-glob";
import fs from "node:fs";

/**
 *
 * @param distDir {String}
 * @param cwd {String}
 * @param debug {Boolean}
 * @returns {Promise<void>}
 */
export const replaceTscAliases = async ({ distDir, cwd, debug = false }) => {
    const dtsFiles = await fg("**/*.d.ts", {
        cwd: distDir,
        absolute: true
    });

    // Build a map of absolute src paths → package names, by scanning sibling packages.
    // This is used to rewrite cross-package src paths (e.g. "../../api/src") back to
    // proper package names (e.g. "@webiny/api") in generated .d.ts files.
    const srcToPackageName = buildSrcToPackageNameMap(cwd);

    for (const dtsFile of dtsFiles) {
        let content = fs.readFileSync(dtsFile, "utf8").toString();
        let modified = false;

        // Replace all imports/exports with ~/ alias
        content = content.replace(
            /(from\s+["'])~\/([^"']+)(["'])/g,
            (_, prefix, importPath, suffix) => {
                modified = true;
                // Calculate relative path from current file to dist root
                const fileDir = dirname(dtsFile).replace(/\\/g, "/");
                const normalizedDistDir = distDir.replace(/\\/g, "/");
                const relativePath = relative(fileDir, normalizedDistDir).replace(/\\/g, "/");
                const finalPath = relativePath
                    ? `${relativePath}/${importPath}`
                    : `./${importPath}`;
                // Normalize to always start with ./
                const normalized = finalPath.startsWith(".") ? finalPath : `./${finalPath}`;
                return `${prefix}${normalized}${suffix}`;
            }
        );

        // Replace cross-package src paths (e.g. "../../api/src/types") with proper package
        // names (e.g. "@webiny/api/types"). TypeScript inlines these relative paths when
        // project references are used and dependencies have paths pointing to src/.
        if (srcToPackageName.size > 0) {
            content = content.replace(
                /["'](\.\.[^"']*\/src(?:\/[^"']*)?)['"]/g,
                (match, relPath) => {
                    const quote = match[0];
                    const absPath = resolve(dirname(dtsFile), relPath);
                    const packageName = resolveToPackageName(absPath, srcToPackageName);
                    if (packageName) {
                        modified = true;
                        return `${quote}${packageName}${quote}`;
                    }
                    return match;
                }
            );
        }

        if (modified) {
            fs.writeFileSync(dtsFile, content, "utf8");
            if (debug) {
                console.log(`Resolved aliases in: ${relative(cwd, dtsFile)}`);
            }
        }
    }
};

/**
 * Scans sibling packages to build a map of absolute src directory paths → package names.
 * @param {string} cwd - The current package directory.
 * @returns {Map<string, string>}
 */
function buildSrcToPackageNameMap(cwd) {
    const map = new Map();
    // Go up to the packages/ directory (cwd is packages/xxx, parent is packages/)
    const packagesDir = resolve(cwd, "..");
    if (!fs.existsSync(packagesDir)) {
        return map;
    }
    let entries;
    try {
        entries = fs.readdirSync(packagesDir);
    } catch {
        return map;
    }
    for (const entry of entries) {
        const pkgDir = join(packagesDir, entry);
        const pkgJsonPath = join(pkgDir, "package.json");
        if (!fs.existsSync(pkgJsonPath)) {
            continue;
        }
        try {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
            if (pkgJson.name) {
                const srcDir = join(pkgDir, "src");
                map.set(srcDir, pkgJson.name);
            }
        } catch {
            // ignore
        }
    }
    return map;
}

/**
 * Given an absolute path that points into a package's src directory, returns the
 * corresponding package name + sub-path (e.g. "@webiny/api/types").
 * @param {string} absPath - Absolute path resolved from the relative import.
 * @param {Map<string, string>} srcToPackageName
 * @returns {string|null}
 */
function resolveToPackageName(absPath, srcToPackageName) {
    for (const [srcDir, packageName] of srcToPackageName) {
        if (absPath === srcDir || absPath.startsWith(srcDir + "/")) {
            const subPath = absPath.slice(srcDir.length).replace(/^\//, "");
            return subPath ? `${packageName}/${subPath}` : packageName;
        }
    }
    return null;
}
