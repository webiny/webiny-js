#!/usr/bin/env node
const { parse, resolve, relative, join } = require("path");
const { getPackages, getPackage } = require("./utils/getPackages");
const { cyan, gray, red, green } = require("chalk");
const argv = require("yargs").argv;

const { _: packagesToCheck } = argv;

const TSCONFIG = {
    DEV: "tsconfig.json",
    BUILD: "tsconfig.build.json"
};

/**
 * This is a small tool that checks if all TS configs in all packages in order. In other words,
 * if a "@webiny/*" dependency exists
 *
 * Usage, check all packages: yarn check-ts-configs
 * Usage, specify packages: yarn check-ts-configs @webiny/api-i18n @webiny/api-i18n-content
 */

(async () => {
    const workspacePackagesErrors = {};
    const workspacesPackages = getPackages();

    for (let i = 0; i < workspacesPackages.length; i++) {
        const workspacePackageObject = workspacesPackages[i];
        if (packagesToCheck.length) {
            if (!packagesToCheck.includes(workspacePackageObject.packageJson.name)) {
                continue;
            }
        }

        const workspacePackageErrors = [];

        // 1. Check if all dependencies are listed in TS configs.

        // In current workspace package's "package.json", in "dependencies" and "devDependencies", only
        // examine dependency packages that are registered as workspaces (e.g. "@webiny/..." packages).
        const workspacePackageWbyDepsNames = Object.keys({
            ...workspacePackageObject.packageJson.dependencies,
            ...workspacePackageObject.packageJson.devDependencies
        }).filter(getPackage);

        for (let j = 0; j < workspacePackageWbyDepsNames.length; j++) {
            let workspacePackageWbyDepName = workspacePackageWbyDepsNames[j];

            const workspacePackageWbyDepObject = getPackage(workspacePackageWbyDepName);
            if (!workspacePackageWbyDepObject) {
                workspacePackageErrors.push({
                    message: `Dependency package "${workspacePackageWbyDepName}" not found. Is the package name correct?`
                });
                continue;
            }

            // Do not check if the package is listed in TS configs if the package we're
            // examining is a plain JS package. We can just continue with the next one.
            if (!workspacePackageWbyDepObject.isTs) {
                continue;
            }

            const depPackageRelativePath = relative(
                workspacePackageObject.packageFolder,
                workspacePackageWbyDepObject.packageFolder
            );

            // 1.1 Check tsconfig.json - "references" property.
            if (workspacePackageObject.tsConfigJson) {
                const tsConfigJsonReferences = workspacePackageObject.tsConfigJson.references || [];
                const exists = tsConfigJsonReferences.find(
                    item => item.path === depPackageRelativePath
                );

                if (!exists) {
                    workspacePackageErrors.push({
                        package: workspacePackageObject,
                        message: `missing "${workspacePackageWbyDepObject.packageJson.name}" in "references" property`,
                        file: TSCONFIG.DEV
                    });
                }
            }

            // 1.1 Check tsconfig.build.json - "references" and "exclude" properties.
            if (workspacePackageObject.tsConfigBuildJson) {
                const tsConfigBuildJsonExclude =
                    workspacePackageObject.tsConfigBuildJson.exclude || [];

                let exists = tsConfigBuildJsonExclude.includes(depPackageRelativePath);
                if (!exists) {
                    workspacePackageErrors.push({
                        package: workspacePackageObject,
                        message: `missing package "${workspacePackageWbyDepObject.packageJson.name}" in "exclude" property`,
                        file: TSCONFIG.BUILD
                    });
                }

                const tsConfigBuildJsonReferences =
                    workspacePackageObject.tsConfigBuildJson.references || [];
                const path = join(depPackageRelativePath, "tsconfig.build.json");
                exists = tsConfigBuildJsonReferences.find(item => item.path === path);
                if (!exists) {
                    workspacePackageErrors.push({
                        package: workspacePackageObject,
                        message: `missing "${workspacePackageWbyDepObject.packageJson.name}" in "references" property`,
                        file: TSCONFIG.BUILD
                    });
                }
            }
        }

        // 2. Check if TS configs have extra package listed (packages not present in package.json).
        if (workspacePackageObject.tsConfigJson && workspacePackageObject.tsConfigJson.references) {
            for (let j = 0; j < workspacePackageObject.tsConfigJson.references.length; j++) {
                // Check if a package is defined in TS config, but not listed in package.json.
                let ref = workspacePackageObject.tsConfigJson.references[j];
                const referencePath = resolve(join(workspacePackageObject.packageFolder, ref.path));
                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        let exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            workspacePackageErrors.push({
                                file: TSCONFIG.DEV,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.DEV} ("references" property), but missing in package.json.`
                            });
                        }
                    } else {
                        workspacePackageErrors.push({
                            file: TSCONFIG.DEV,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "references"`
                        });
                    }
                }
            }
        }

        if (
            workspacePackageObject.tsConfigBuildJson &&
            workspacePackageObject.tsConfigBuildJson.references
        ) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < workspacePackageObject.tsConfigBuildJson.references.length; j++) {
                let ref = workspacePackageObject.tsConfigBuildJson.references[j];
                const referencePath = resolve(
                    join(workspacePackageObject.packageFolder, parse(ref.path).dir)
                );

                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        let exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            workspacePackageErrors.push({
                                file: TSCONFIG.BUILD,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("references" property), but missing in package.json.`
                            });
                        }
                    } else {
                        workspacePackageErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "references"`
                        });
                    }
                }
            }
        }

        if (
            workspacePackageObject.tsConfigBuildJson &&
            workspacePackageObject.tsConfigBuildJson.exclude
        ) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < workspacePackageObject.tsConfigBuildJson.exclude.length; j++) {
                let ref = workspacePackageObject.tsConfigBuildJson.exclude[j];
                const referencePath = resolve(join(workspacePackageObject.packageFolder, ref));
                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        let exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            workspacePackageErrors.push({
                                file: TSCONFIG.BUILD,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("exclude" property), but missing in package.json.`
                            });
                        }
                    } else {
                        workspacePackageErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "exclude"`
                        });
                    }
                }
            }
        }

        if (workspacePackageErrors.length) {
            workspacePackagesErrors[workspacePackageObject.packageJson.name] = {
                package: workspacePackageObject,
                errors: workspacePackageErrors
            };
        }
    }

    if (!Object.keys(workspacePackagesErrors).length) {
        console.log(green("✅  All TS configs in order!"));
        process.exit(0);
    }

    for (let workspacePackageName in workspacePackagesErrors) {
        const {
            package: workspacePackageObject,
            errors: workspacePackageErrors
        } = workspacePackagesErrors[workspacePackageName];

        console.log(
            cyan(
                `${workspacePackageObject.packageJson.name} (${workspacePackageObject.packageFolder})`
            )
        );

        const errorsByFiles = workspacePackageErrors.reduce((current, item) => {
            if (!current[item.file]) {
                current[item.file] = [];
            }

            current[item.file].push(item);
            return current;
        }, {});

        for (let file in errorsByFiles) {
            const fileErrors = errorsByFiles[file];
            if (fileErrors.length) {
                console.log(` ${gray(file)}`);
                for (let i = 0; i < fileErrors.length; i++) {
                    let fileError = fileErrors[i];
                    console.log(`  ${red(`${i + 1}. ${fileError.message}`)}`);
                }
            }
        }

        console.log();
    }

    process.exit(1);
})();
