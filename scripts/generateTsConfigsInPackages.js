#!/usr/bin/env node
import { getPackage, getPackages } from "./utils/getPackages.js";
import { relative } from "path";
import { format } from "oxfmt";
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).parse();
const { _: packagesToCheck } = argv;

/**
 * This tool generates tsconfig.json and tsconfig.build.json files for all workspaces within the `packages` folder.
 */

function getRelativePath(a, b) {
    return relative(a, b).replace(/\\/g, "/");
}

async function output(target, content) {
    const result = await format(target, content);
    fs.writeFileSync(target, result.code);
}

/**
 * The key point: both tsconfig.json and tsconfig.build.json should reference source files during
 * development and build. TypeScript's project references handle building dependencies in the correct
 * order, so each package always compiles against the source of its dependencies, not their built
 * output.
 */

(async () => {
    const workspaces = getPackages({ includes: ["/packages/"] });

    for (const wpObject of workspaces) {
        if (!wpObject.isTs) {
            continue;
        }

        if (packagesToCheck.length) {
            if (!packagesToCheck.includes(wpObject.packageJson.name)) {
                continue;
            }
        }

        /* All deps (production + dev + peer) — used for tsconfig.json which covers src + __tests__. */
        const dependencies = Object.keys({
            ...wpObject.packageJson.dependencies,
            ...wpObject.packageJson.devDependencies,
            ...wpObject.packageJson.peerDependencies
        })
            .filter(getPackage)
            .filter(name => workspaces.find(pkg => pkg.packageJson.name === name).isTs)
            .map(name => workspaces.find(pkg => pkg.packageJson.name === name));

        /* Production-only deps — used for tsconfig.build.json references to avoid devDep cycles. */
        const buildDependencies = Object.keys({
            ...wpObject.packageJson.dependencies,
            ...wpObject.packageJson.peerDependencies
        })
            .filter(getPackage)
            .filter(name => workspaces.find(pkg => pkg.packageJson.name === name).isTs)
            .map(name => workspaces.find(pkg => pkg.packageJson.name === name));

        // Generate path mappings for dependencies with package.json exports
        function generateExportPaths(dep, folder) {
            const paths = {};
            const relPath = getRelativePath(wpObject.packageFolder, dep.packageFolder);

            // Check if the dependency has exports defined
            if (dep.packageJson.exports && typeof dep.packageJson.exports === "object") {
                Object.keys(dep.packageJson.exports).forEach(exportPath => {
                    if (exportPath === "." || exportPath === "./*") {
                        return; // Skip root exports, handled by base paths
                    }

                    const exportTarget = dep.packageJson.exports[exportPath];
                    if (typeof exportTarget === "string") {
                        // Trim leading "./" from export path
                        const cleanExportPath = exportPath.replace(/^\.\//, "");
                        // Trim leading "./" from target path, keep the extension as-is
                        const sourcePath = exportTarget.replace(/^\.\//, "");
                        paths[`${dep.name}/${cleanExportPath}`] = [
                            `${relPath}/${folder}/${sourcePath}`
                        ];
                    }
                });
            }

            return paths;
        }

        // Generate `tsconfig.json`
        const tsconfigJson = {
            extends: "../../tsconfig.json",
            include: ["src", "__tests__"],
            references: dependencies.map(dep => ({
                path: `${getRelativePath(wpObject.packageFolder, dep.packageFolder)}`
            })),
            compilerOptions: {
                rootDirs: ["./src", "./__tests__"],
                outDir: "./dist",
                declarationDir: "./dist",
                paths: {
                    "~/*": ["./src/*"],
                    "~tests/*": ["./__tests__/*"],
                    ...dependencies.reduce((acc, dep) => {
                        const relPath = getRelativePath(wpObject.packageFolder, dep.packageFolder);
                        // Add export-based paths first (more specific)
                        Object.assign(acc, generateExportPaths(dep, "src"));
                        // Add base paths (less specific, used as fallback)
                        acc[`${dep.name}/*`] = [`${relPath}/src/*`];
                        acc[`${dep.name}`] = [`${relPath}/src`];
                        return acc;
                    }, {})
                }
            }
        };

        await output(wpObject.tsConfigJsonPath, JSON.stringify(tsconfigJson));

        /* Generate `tsconfig.build.json` using production-only deps to avoid devDep reference cycles. */
        const tsconfigBuildJson = {
            extends: "../../tsconfig.build.json",
            include: ["src"],
            references: buildDependencies.map(dep => ({
                path: `${getRelativePath(
                    wpObject.packageFolder,
                    dep.packageFolder
                )}/tsconfig.build.json`
            })),
            compilerOptions: {
                rootDir: "./src",
                outDir: "./dist",
                declarationDir: "./dist",
                paths: {
                    "~/*": ["./src/*"],
                    "~tests/*": ["./__tests__/*"],
                    ...buildDependencies.reduce((acc, dep) => {
                        const relPath = getRelativePath(wpObject.packageFolder, dep.packageFolder);
                        /* Add export-based paths first (more specific). */
                        Object.assign(acc, generateExportPaths(dep, "src"));
                        /* Add base paths (less specific, used as fallback). */
                        acc[`${dep.name}/*`] = [`${relPath}/src/*`];
                        acc[`${dep.name}`] = [`${relPath}/src`];
                        return acc;
                    }, {})
                }
            }
        };

        await output(wpObject.tsConfigBuildJsonPath, JSON.stringify(tsconfigBuildJson));
    }
})();
