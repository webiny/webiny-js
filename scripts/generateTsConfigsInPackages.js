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
 *
 * Each workspace dependency gets just two path mappings: `<dep>` -> `src` and `<dep>/*` -> `src/*`.
 * Subpath exports don't need their own mappings — the `<dep>/*` mapping already resolves them to the
 * matching source folder.
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

        // Get package dependencies that are registered as workspaces within the repo.
        const dependencies = Object.keys({
            ...wpObject.packageJson.dependencies,
            ...wpObject.packageJson.devDependencies,
            ...wpObject.packageJson.peerDependencies
        })
            .filter(getPackage)
            .filter(name => workspaces.find(pkg => pkg.packageJson.name === name).isTs)
            .map(name => workspaces.find(pkg => pkg.packageJson.name === name));

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
                        acc[`${dep.name}/*`] = [`${relPath}/src/*`];
                        acc[`${dep.name}`] = [`${relPath}/src`];
                        return acc;
                    }, {})
                }
            }
        };

        await output(wpObject.tsConfigJsonPath, JSON.stringify(tsconfigJson));

        // Generate `tsconfig.build.json`
        const tsconfigBuildJson = {
            extends: "../../tsconfig.build.json",
            include: ["src"],
            references: dependencies.map(dep => ({
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
                    ...dependencies.reduce((acc, dep) => {
                        const relPath = getRelativePath(wpObject.packageFolder, dep.packageFolder);
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
