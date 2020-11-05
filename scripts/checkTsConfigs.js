#!/usr/bin/env node
const { parse, resolve, relative, join } = require("path");
const getPackages = require("./utils/getPackages");
const { cyan, gray, red, green } = require("chalk");
const get = require("lodash.get");

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
    const workspacePackagesErrors = {};

    for (let i = 0; i < workspacesPackages.length; i++) {
        const workspacePackageObject = workspacesPackages[i];

        const workspacePackageErrors = [];

        // Checking for missing packages in TS configs.
        // Only examine packages that are registered as workspaces.
        const workspacePackageWbyDepsNames = Object.keys({
            ...workspacePackageObject.packageJson.dependencies,
            ...workspacePackageObject.packageJson.devDependencies
        }).filter(packageName =>
            workspacesPackages.find(wp => wp.packageJson.name === packageName)
        );

        for (let j = 0; j < workspacePackageWbyDepsNames.length; j++) {
            let workspacePackageWbyDepName = workspacePackageWbyDepsNames[j];

            let workspacePackageWbyDepObject;

            for (let i = 0; i < workspacesPackages.length; i++) {
                let p = workspacesPackages[i];
                if (p.packageJson.name === workspacePackageWbyDepName) {
                    workspacePackageWbyDepObject = p;
                    break;
                }
            }

            if (!workspacePackageWbyDepObject) {
                workspacePackageErrors.push({
                    message: `Dependency package "${workspacePackageWbyDepName}" not found.`
                });
                continue;
            }

            const depPackageRelativePath = relative(
                workspacePackageObject.packageFolder,
                workspacePackageWbyDepObject.packageFolder
            );

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

        if (workspacePackageObject.tsConfigJson && workspacePackageObject.tsConfigJson.references) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < workspacePackageObject.tsConfigJson.references.length; j++) {
                let ref = workspacePackageObject.tsConfigJson.references[j];
                const referencePath = resolve(
                    join(workspacePackageObject.packageFolder, ref.path)
                );
                const refPackageObject = workspacesPackages.find(
                    item => item.packageFolder === referencePath
                );

                if (refPackageObject) {
                    let exists = workspacePackageWbyDepsNames.includes(
                        refPackageObject.packageJson.name
                    );


                    if (!exists) {
                        workspacePackageErrors.push({
                            file: TSCONFIG.DEV,
                            message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.DEV} ("references" property), but missing in package.json.`
                        });
                    }
                }
            }
        }

        if (workspacePackageObject.tsConfigBuildJson && workspacePackageObject.tsConfigBuildJson.references) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < workspacePackageObject.tsConfigBuildJson.references.length; j++) {
                let ref = workspacePackageObject.tsConfigBuildJson.references[j];
                const referencePath = resolve(
                    join(workspacePackageObject.packageFolder, parse(ref.path).dir)
                );

                const refPackageObject = workspacesPackages.find(
                    item => item.packageFolder === referencePath
                );

                if (refPackageObject) {
                    let exists = workspacePackageWbyDepsNames.includes(
                        refPackageObject.packageJson.name
                    );


                    if (!exists) {
                        workspacePackageErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("references" property), but missing in package.json.`
                        });
                    }
                }
            }
        }

        if (workspacePackageObject.tsConfigBuildJson && workspacePackageObject.tsConfigBuildJson.exclude) {
            // Check if a package is defined in TS config, but not listed in package.json.
            for (let j = 0; j < workspacePackageObject.tsConfigBuildJson.exclude.length; j++) {
                let ref = workspacePackageObject.tsConfigBuildJson.exclude[j];
                const referencePath = resolve(
                    join(workspacePackageObject.packageFolder, ref)
                );
                const refPackageObject = workspacesPackages.find(
                    item => item.packageFolder === referencePath
                );

                if (refPackageObject) {
                    let exists = workspacePackageWbyDepsNames.includes(
                        refPackageObject.packageJson.name
                    );


                    if (!exists) {
                        workspacePackageErrors.push({
                            file: TSCONFIG.BUILD,
                            message: `package "${refPackageObject.packageJson.name}" defined in ${TSCONFIG.BUILD} ("exclude" property), but missing in package.json.`
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
        console.log(green("✅  All configs in order!"));
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

// 2. tsconfig.build.json
/* json = workspacePackageObject.tsConfigBuildJson;
if (json) {
    if (Array.isArray(json.references)) {
        for (let j = 0; j < json.references.length; j++) {
            let ref = json.references[j];
            const refPackagePath = resolve(
                join(workspacePackageObject.packageFolder, parse(ref.path).dir)
            );
            const refPackage = workspacesPackages.find(
                item => item.packageFolder === refPackagePath
            );

            if (refPackage) {
                let exists =
                    workspacePackageObject.packageJson.dependencies &&
                    workspacePackageObject.packageJson.dependencies[
                        refPackage.packageJson.name
                    ];

                if (!exists) {
                    exists =
                        workspacePackageObject.packageJson.devDependencies &&
                        workspacePackageObject.packageJson.devDependencies[
                            refPackage.packageJson.name
                        ];
                }

                if (!exists) {
                    throw {
                        file: TSCONFIG.BUILD,
                        message: `package "${refPackage.packageJson.name}" defined in ${TSCONFIG.DEV} ("references" property), but missing in package.json.`
                    };
                }
            }
        }
    }

    if (Array.isArray(json.exclude)) {
        for (let j = 0; j < json.exclude.length; j++) {
            let ref = json.exclude[j];
            const refPackagePath = resolve(
                join(workspacePackageObject.packageFolder, ref)
            );
            const refPackage = workspacesPackages.find(
                item => item.packageFolder === refPackagePath
            );

            if (refPackage) {
                let exists =
                    workspacePackageObject.packageJson.dependencies &&
                    workspacePackageObject.packageJson.dependencies[
                        refPackage.packageJson.name
                    ];

                if (!exists) {
                    exists =
                        workspacePackageObject.packageJson.devDependencies &&
                        workspacePackageObject.packageJson.devDependencies[
                            refPackage.packageJson.name
                        ];
                }

                if (!exists) {
                    throw {
                        file: TSCONFIG.BUILD,
                        message: `package "${refPackage.packageJson.name}" defined in ${TSCONFIG.DEV} ("exclude" property), but missing in package.json.`
                    };
                }
            }
        }
    }
}*/
