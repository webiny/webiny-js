#!/usr/bin/env node
const { dirname, resolve, relative, join } = require("path");
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
    const includes = ["/packages/"];

    const workspacesPackages = getPackages({ includes }).filter(pkg => pkg.isTs);

    for (const wpObject of workspacesPackages) {
        if (packagesToCheck.length) {
            if (!packagesToCheck.includes(wpObject.packageJson.name)) {
                continue;
            }
        }

        const wpErrors = [];

        try {
            // 1. Check if all dependencies are listed in TS configs.

            // In current workspace package's "package.json", in "dependencies" and "devDependencies", only
            // examine dependency packages that are registered as workspaces (e.g. "@webiny/..." packages).
            const workspacePackageWbyDepsNames = Object.keys({
                ...wpObject.packageJson.dependencies,
                ...wpObject.packageJson.devDependencies
            }).filter(getPackage);

            for (const wpWbyDepName of workspacePackageWbyDepsNames) {
                const wpWbyDepObject = getPackage(wpWbyDepName);
                if (!wpWbyDepObject) {
                    errorsCount++;
                    wpErrors.push({
                        message: `Dependency package "${wpWbyDepName}" not found. Is the package name correct?`
                    });
                    continue;
                }

                // If a dependency is not a TS package, skip it.
                if (!wpWbyDepObject.isTs) {
                    continue;
                }

                const depPackageRelativePath = relative(
                    wpObject.packageFolder,
                    wpWbyDepObject.packageFolder
                ).replace(/\\/g, "/");

                const checkReferences = (config, configType) => {
                    const checkPath =
                        configType === TSCONFIG.DEV
                            ? depPackageRelativePath
                            : `${depPackageRelativePath}/tsconfig.build.json`;

                    const exists = (config.references || []).find(item => item.path === checkPath);

                    if (!exists) {
                        errorsCount++;
                        wpErrors.push({
                            package: wpObject,
                            message: `missing "${wpWbyDepObject.packageJson.name}" in "references" property`,
                            file: configType
                        });
                    }
                };

                // 1.1 Check tsconfig.json - "references" property.
                if (wpObject.tsConfigJson) {
                    checkReferences(wpObject.tsConfigJson, TSCONFIG.DEV);
                }

                if (wpObject.tsConfigBuildJson) {
                    checkReferences(wpObject.tsConfigBuildJson, TSCONFIG.BUILD);
                }
            }

            const checkForExtraPackagesInTsConfig = (wpObject, config, configType) => {
                for (const ref of config.references || []) {
                    // Check if a package is defined in TS config, but not listed in package.json.
                    const referencePath = resolve(
                        join(wpObject.packageFolder, dirname(ref.path))
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
                                    file: configType,
                                    message: `package "${refPackageObject.packageJson.name}" defined in ${configType} ("references" property), but missing in package.json.`
                                });
                            }
                        } else {
                            errorsCount++;
                            wpErrors.push({
                                file: configType,
                                message: `package "${refPackageObject.packageJson.name}" is not a TypeScript package - remove it from "references"`
                            });
                        }
                    } else {
                        // Only throw an error if the path points to a workspace folder.
                        if (pathPointsToWorkspacePackage(referencePath)) {
                            errorsCount++;
                            wpErrors.push({
                                file: configType,
                                message: `Could not find the package referenced via the "${ref.path}" path in "references" property`
                            });
                        }
                    }
                }
            };

            // 2. Check if TS configs have extra package listed (packages not present in package.json).
            checkForExtraPackagesInTsConfig(wpObject, wpObject.tsConfigJson, TSCONFIG.DEV);
            checkForExtraPackagesInTsConfig(wpObject, wpObject.tsConfigBuildJson, TSCONFIG.BUILD);

            if (wpErrors.length) {
                errors[wpObject.packageJson.name] = {
                    package: wpObject,
                    errors: wpErrors
                };
            }
        } catch (err) {
            console.log(`ERROR IN ${wpObject.packageJson.name}!`, err);
        }
    }

    for (const workspacePackageName in errors) {
        const { package: workspacePackageObject, errors: workspacePackageErrors } =
            errors[workspacePackageName];

        console.log(
            `${green(workspacePackageObject.packageJson.name)} (${cyan(
                relative(process.cwd(), workspacePackageObject.packageFolder)
            )})`
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
