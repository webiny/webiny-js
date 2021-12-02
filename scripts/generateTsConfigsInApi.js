#!/usr/bin/env node
const { getPackages, getPackage } = require("./utils/getPackages");
const { relative } = require("path");
const prettier = require("prettier");
const fs = require("fs");

/**
 * This tool generates tsconfig.json files for all workspaces within the `api` folder.
 */

function getRelativePath(a, b) {
    return relative(a, b).replace(/\\/g, "/");
}

async function output(target, content) {
    const options = await prettier.resolveConfig(target);
    const fileContentFormatted = prettier.format(content, {
        ...options,
        filepath: target
    });
    fs.writeFileSync(target, fileContentFormatted);
}

(async () => {
    const workspaces = getPackages();

    for (const wpObject of workspaces) {
        if (!wpObject.isTs) {
            continue;
        }

        if (!wpObject.packageFolder.includes("api/")) {
            continue;
        }

        // Get package dependencies that are registered as workspaces within the repo.
        const dependencies = Object.keys({
            ...wpObject.packageJson.dependencies,
            ...wpObject.packageJson.devDependencies
        })
            .filter(getPackage)
            .filter(name => workspaces.find(pkg => pkg.packageJson.name === name).isTs)
            .map(name => workspaces.find(pkg => pkg.packageJson.name === name));

        // Generate `tsconfig.json`
        const tsconfigJson = {
            extends: "../../tsconfig.json",
            include: ["src"],
            references: dependencies.map(dep => ({
                path: `${getRelativePath(wpObject.packageFolder, dep.packageFolder)}`
            })),
            compilerOptions: {
                paths: {
                    "~/*": ["./src/*"],
                    ...dependencies.reduce((acc, dep) => {
                        const relPath = getRelativePath(wpObject.packageFolder, dep.packageFolder);
                        acc[`${dep.name}/*`] = [`${relPath}/src/*`];
                        acc[`${dep.name}`] = [`${relPath}/src`];
                        return acc;
                    }, {})
                },
                baseUrl: "."
            }
        };

        await output(wpObject.tsConfigJsonPath, JSON.stringify(tsconfigJson));
    }
})();
