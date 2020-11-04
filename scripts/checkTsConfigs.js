#!/usr/bin/env node
const { relative, join } = require("path");
const getPackages = require("./utils/getWorkspaces");

/**
 * This is a small tool that checks if all TS configs in all packages in order. In other words,
 * if a "@webiny/*" dependency exists
 */

(async () => {
    const packages = getPackages();
    for (const i = 0; i < packages.length; i++) {
        const pckg = packages[i];
        const deps = packages[i].packageJson.dependencies || [];

        for (const name in deps) {
            if (name.startsWith("@webiny")) {
                let depPckg;
                for (let i = 0; i < packages.length; i++) {
                    const pckg = packages[i];
                    if (pckg.packageJson.name === name) {
                        depPckg = pckg;
                    }
                }

                if (!depPckg) {
                    throw Error("!depPckg");
                }

                const depPackageRelativePath = relative(
                    pckg.packageFolder,
                    join(depPckg.packageFolder)
                );

                if (pckg.tsConfigJson) {
                    const exists = pckg.tsConfigJson.references.find(
                        item => item.path === depPackageRelativePath
                    );

                    if (!exists) {
                        throw new Error("pckg.tsConfigJson.references");
                    }
                }

                if (pckg.tsConfigBuildJson) {
                    let exists = pckg.tsConfigBuildJson.exclude.includes(depPackageRelativePath);
                    if (!exists) {
                        throw new Error("pckg.tsConfigBuildJson.exclude");
                    }

                    const path = join(depPackageRelativePath, "tsconfig.build.json");
                    exists = pckg.tsConfigBuildJson.references.find(item => item.path === path);
                    if (!exists) {
                        throw new Error("pckg.tsConfigBuildJson.references");
                    }
                }
            }
        }
    }

    process.exit(0);
})();
