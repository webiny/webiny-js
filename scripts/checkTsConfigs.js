#!/usr/bin/env node
const { relative, join } = require("path");
const getPackages = require("./utils/getWorkspaces");
const { cyan, gray, red, green } = require("chalk");

const TSCONFIG = {
    DEV: "tsconfig.json",
    BUILD: "tsconfig.build.json"
};

/**
 * This is a small tool that checks if all TS configs in all packages in order. In other words,
 * if a "@webiny/*" dependency exists
 */

(async () => {
    const workspacesPackages = getPackages();
    const errors = {};

    for (let i = 0; i < workspacesPackages.length; i++) {
        const workspacePackage = workspacesPackages[i];
        const workspacePackageObject = workspacesPackages[i];

        const workspacePackageDeps = workspacePackageObject.packageJson.dependencies || {};
        for (let workspacePackageDepName in workspacePackageDeps) {
            if (typeof workspacePackageDepName !== "string") {
                continue;
            }

            if (!workspacePackageDepName.startsWith("@webiny")) {
                continue;
            }

            let dependencyPackageObject;

            for (let i = 0; i < workspacesPackages.length; i++) {
                let p = workspacesPackages[i];
                if (p.packageJson.name === workspacePackageDepName) {
                    dependencyPackageObject = p;
                    break;
                }
            }

            if (!dependencyPackageObject) {
                console.log("Missing dependency...", workspacePackageDepName);
                throw Error("!depPckg");
            }

            try {
                const depPackageRelativePath = relative(
                    workspacePackage.packageFolder,
                    dependencyPackageObject.packageFolder
                );

                if (workspacePackage.tsConfigJson) {
                    if (!Array.isArray(workspacePackage.tsConfigJson.references)) {
                        throw {
                            message: `"references" property missing in "${TSCONFIG.DEV}".`,
                            file: TSCONFIG.DEV
                        };
                    }

                    const exists = workspacePackage.tsConfigJson.references.find(
                        item => item.path === depPackageRelativePath
                    );

                    if (!exists) {
                        throw {
                            message: `Missing "${dependencyPackageObject.packageJson.name}".`,
                            file: TSCONFIG.DEV
                        };
                    }
                }

                if (workspacePackage.tsConfigBuildJson) {
                    if (!Array.isArray(workspacePackage.tsConfigBuildJson.exclude)) {
                        throw {
                            message: `"exclude" property missing.`,
                            file: TSCONFIG.BUILD
                        };
                    }

                    let exists = workspacePackage.tsConfigBuildJson.exclude.includes(
                        depPackageRelativePath
                    );
                    if (!exists) {
                        throw {
                            message: `Missing "${dependencyPackageObject.packageJson.name}".`,
                            file: TSCONFIG.BUILD
                        };
                    }

                    if (!Array.isArray(workspacePackage.tsConfigBuildJson.references)) {
                        throw {
                            message: `"references" property missing.`,
                            file: TSCONFIG.BUILD
                        };
                    }

                    const path = join(depPackageRelativePath, "tsconfig.build.json");
                    exists = workspacePackage.tsConfigBuildJson.references.find(
                        item => item.path === path
                    );
                    if (!exists) {
                        throw {
                            message: `Missing "${dependencyPackageObject.packageJson.name}".`,
                            file: TSCONFIG.BUILD
                        };
                    }
                }
            } catch (e) {
                if (!e.file) {
                    throw e;
                }

                if (!errors[workspacePackageObject.packageJson.name]) {
                    errors[workspacePackageObject.packageJson.name] = {
                        [TSCONFIG.DEV]: [],
                        [TSCONFIG.BUILD]: []
                    };
                }

                errors[workspacePackageObject.packageJson.name][e.file].push(e);
            }
        }
    }

    if (!Object.keys(errors).length) {
        console.log(green("✅  All configs in order!"))
        process.exit(0);
    }

    for (let packageName in errors) {
        console.log(cyan(packageName));
        const files = errors[packageName];
        for (let file in files) {
            const fileErrors = files[file];
            if (fileErrors.length) {
                console.log(`  ${gray(file)}`);
                for (let i = 0; i < fileErrors.length; i++) {
                    let fileError = fileErrors[i];
                    console.log(`    ${red(fileError.message)}`);
                }
            }
        }

        console.log();
    }

    process.exit(1);
})();
