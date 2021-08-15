#!/usr/bin/env node
const { parse, resolve, relative, join } = require("path");
const { getPackages, getPackage, rootPackageJson, PROJECT_ROOT } = require("./utils/getPackages");
const { yellow, cyan, gray, red, green } = require("chalk");
const argv = require("yargs").argv;
const minimatch = require("minimatch");

const { _: packagesToCheck } = argv;

// If a package reference is pointing to a package that is a part of a workspace, return true;
const pathPointsToWorkspacePackage = packageAbsolutePath => {
    const workspaces = rootPackageJson.workspaces.packages;
    for (let i = 0; i < workspaces.length; i++) {
        const absolutePath = resolve(join(PROJECT_ROOT, workspaces[i])).replace(/\\/g, "/");
        if (minimatch(packageAbsolutePath, absolutePath)) {
            return true;
        }
    }

    return false;
};

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
    const errors = {};
    let errorsCount = 0;
    const warningsCount = 0;

    const workspacesPackages = getPackages({ includes: "/packages/" });

    for (let i = 0; i < workspacesPackages.length; i++) {
        const wpObject = workspacesPackages[i];
        if (packagesToCheck.length) {
            if (!packagesToCheck.includes(wpObject.packageJson.name)) {
                continue;
            }
        }

        const wpErrors = [];

        // 1. Check if all dependencies are listed in TS configs.

        // In current workspace package's "package.json", in "dependencies" and "devDependencies", only
        // examine dependency packages that are registered as workspaces (e.g. "@webiny/..." packages).
        const workspacePackageWbyDepsNames = Object.keys({
            ...wpObject.packageJson.dependencies,
            ...wpObject.packageJson.devDependencies
        }).filter(getPackage);

        for (let j = 0; j < workspacePackageWbyDepsNames.length; j++) {
            const wpWbyDepName = workspacePackageWbyDepsNames[j];

            const wpWbyDepObject = getPackage(wpWbyDepName);
            if (!wpWbyDepObject) {
                errorsCount++;
                wpErrors.push({
                    message: `Dependency package "${wpWbyDepName}" not found. Is the package name correct?`
                });
                continue;
            }

            // Do not check if the package is listed in TS configs if the package we're
            // examining is a plain JS package. We can just continue with the next one.
            if (!wpWbyDepObject.isTs) {
                continue;
            }

            const depPackageRelativePath = relative(
                wpObject.packageFolder,
                wpWbyDepObject.packageFolder
            ).replace(/\\/g, "/");

            // 1.1 Check tsconfig.json - "references" property.
            if (wpObject.tsConfigJson) {
                const tsConfigJsonReferences = wpObject.tsConfigJson.references || [];
                const exists = tsConfigJsonReferences.find(
                    item => item.path === depPackageRelativePath
                );

                if (!exists) {
                    errorsCount++;
                    wpErrors.push({
                        package: wpObject,
                        message: `missing "${wpWbyDepObject.packageJson.name}" in "references" property`,
                        file: TSCONFIG.DEV
                    });
                }
            }

            // 1.1 Check tsconfig.build.json - "references" and "exclude" properties.
            if (wpObject.tsConfigBuildJson) {
                const tsConfigBuildJsonExclude = wpObject.tsConfigBuildJson.exclude || [];

                let exists = tsConfigBuildJsonExclude.includes(depPackageRelativePath);
                if (!exists) {
                    errorsCount++;
                    wpErrors.push({
                        package: wpObject,
                        message: `missing package "${wpWbyDepObject.packageJson.name}" in "exclude" property`,
                        file: TSCONFIG.BUILD
                    });
                }

                //const tsConfigBuildJsonReferences = wpObject.tsConfigBuildJson.references || [];
                //
                //const path = join(depPackageRelativePath, "tsconfig.build.json").replace(
                //    /\\/g,
                //    "/"
                //);
                //exists = tsConfigBuildJsonReferences.find(item => item.path === path);
                //if (!exists) {
                //    errorsCount++;
                //    wpErrors.push({
                //        package: wpObject,
                //        message: `missing "${wpWbyDepObject.packageJson.name}" in "references" property`,
                //        file: TSCONFIG.BUILD
                //    });
                //}
            }
        }

        // 2. Check if TS configs have extra package listed (packages not present in package.json).
        if (wpObject.tsConfigJson && wpObject.tsConfigJson.references) {
            for (let j = 0; j < wpObject.tsConfigJson.references.length; j++) {
                // Check if a package is defined in TS config, but not listed in package.json.
                const ref = wpObject.tsConfigJson.references[j];
                const referencePath = resolve(join(wpObject.packageFolder, ref.path)).replace(
                    /\\/g,
                    "/"
                );
                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        const exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            errorsCount++;
                            wpErrors.push({
                                file: TSCONFIG.DEV,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.DEV} ("references" property), but missing in package.json.`
                            });
                        }
                    } else {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.DEV,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "references"`
                        });
                    }
                } else {
                    // Only throw an error if the path points to a workspace folder.
                    if (pathPointsToWorkspacePackage(referencePath)) {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.DEV,
                            message: `Could not find the package referenced via the "${ref.path}" path in "references" property`
                        });
                    }
                }
            }
        }

        if (wpObject.tsConfigBuildJson && wpObject.tsConfigBuildJson.references) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < wpObject.tsConfigBuildJson.references.length; j++) {
                const ref = wpObject.tsConfigBuildJson.references[j];
                const referencePath = resolve(
                    join(wpObject.packageFolder, parse(ref.path).dir)
                ).replace(/\\/g, "/");

                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        const exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            errorsCount++;
                            wpErrors.push({
                                file: TSCONFIG.BUILD,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("references" property), but missing in package.json.`
                            });
                        }
                    } else {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "references"`
                        });
                    }
                } else {
                    // Only throw an error if the path points to a workspace folder.
                    if (pathPointsToWorkspacePackage(referencePath)) {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `Could not find the package referenced via the "${ref.path}" path in "references" property`
                        });
                    }
                }
            }
        }

        if (wpObject.tsConfigBuildJson && wpObject.tsConfigBuildJson.exclude) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < wpObject.tsConfigBuildJson.exclude.length; j++) {
                const ref = wpObject.tsConfigBuildJson.exclude[j];
                const referencePath = resolve(join(wpObject.packageFolder, ref)).replace(
                    /\\/g,
                    "/"
                );
                const refPackageObject = getPackage(referencePath);

                if (refPackageObject) {
                    if (refPackageObject.isTs) {
                        const exists = workspacePackageWbyDepsNames.includes(
                            refPackageObject.packageJson.name
                        );

                        if (!exists) {
                            errorsCount++;
                            wpErrors.push({
                                file: TSCONFIG.BUILD,
                                message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("exclude" property), but missing in package.json.`
                            });
                        }
                    } else {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "exclude"`
                        });
                    }
                } else {
                    // Only throw an error if the path points to a workspace folder.
                    if (pathPointsToWorkspacePackage(referencePath)) {
                        errorsCount++;
                        wpErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `Could not find the package referenced via the "${ref}" path in "exclude" property`
                        });
                    }
                }
            }
        }

        if (wpErrors.length) {
            errors[wpObject.packageJson.name] = {
                package: wpObject,
                errors: wpErrors
            };
        }
    }

    for (const workspacePackageName in errors) {
        const { package: workspacePackageObject, errors: workspacePackageErrors } =
            errors[workspacePackageName];

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

        for (const file in errorsByFiles) {
            const fileErrors = errorsByFiles[file];
            if (fileErrors.length) {
                console.log(` ${gray(file)}`);
                for (let i = 0; i < fileErrors.length; i++) {
                    const fileError = fileErrors[i];
                    const color = fileError.warning ? yellow : red;
                    console.log(`  ${color(`${i + 1}. ${fileError.message}`)}`);
                }
            }
        }
    }

    console.log();

    console.log(red(`Total errors: ${errorsCount}`));
    console.log(yellow(`Total warnings: ${warningsCount}`));

    if (errorsCount === 0) {
        console.log();
        console.log(green("✅  All TS configs in order!"));
        process.exit(0);
    }

    process.exit(1);
})();
