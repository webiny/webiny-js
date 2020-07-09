#!/usr/bin/env node
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const getWorkspaces = require("get-yarn-workspaces");
const { yellow, blue, cyan } = require("chalk");
const argv = require("yargs").argv;

/**
 * This is a small tool that updates the versions of all @webiny packages across the sample project.
 * Useful for example when new @next versions are released, and when those need to be tested
 * with packages in this repo.
 *
 * Usage:
 * - yarn webiny-versions --preview
 * - yarn webiny-versions
 */

const getPackages = pattern => {
    return getWorkspaces()
        .filter(item => item.includes(pattern))
        .map(path => {
            const packageJsonPath = path + "/package.json";
            try {
                return { packageJsonPath, packageJson: readJson.sync(packageJsonPath) };
            } catch {
                console.log(yellow(`Ignoring ${path}/package.json`));
                return null;
            }
        })
        .filter(Boolean);
};

const WEBINY_PACKAGES = getPackages("/packages/");
const SAMPLE_PACKAGES = [...getPackages("/api/"), ...getPackages("/apps/")];

const PREVIEW = argv.preview;

(async () => {
    if (PREVIEW) {
        console.log("Running in preview mode, no changes to the package.json files will be made.");
    }

    const lernaFile = await readJson("lerna.json");
    const versionFromLernaFile = lernaFile.version;

    console.log();

    if (PREVIEW) {
        console.log("🐰 After running the command, the following changes will be made:");
        console.log("=================================================================");
    } else {
        console.log("🐰️ The following changes were made:");
        console.log("===================================");
    }

    for (let i = 0; i < SAMPLE_PACKAGES.length; i++) {
        const { packageJsonPath, packageJson } = SAMPLE_PACKAGES[i];

        if (!mustProcessPackage(packageJson)) {
            continue;
        }

        console.log(`${cyan(packageJson.name)}`);
        const depsCount = processDeps({
            deps: packageJson.dependencies,
            nextFixedVersion: versionFromLernaFile
        });
        const devDepsCount = processDeps({
            deps: packageJson.devDependencies,
            nextFixedVersion: versionFromLernaFile
        });

        if (depsCount || devDepsCount) {
            !PREVIEW && (await writeJson(packageJsonPath, packageJson));
        } else {
            console.log("All up-to-date.");
        }

        console.log();
    }

    process.exit(0);
})();

function mustProcessPackage(json) {
    const depsTypes = ["dependencies", "devDependencies"];
    for (let i = 0; i < depsTypes.length; i++) {
        let type = depsTypes[i];
        if (json[type]) {
            for (let name in json[type]) {
                if (WEBINY_PACKAGES.find(item => item.packageJson.name === name)) {
                    return true;
                }
            }
        }
    }
}

function processDeps({ deps, nextFixedVersion }) {
    let processedCount = 0;

    for (let key in deps) {
        if (!WEBINY_PACKAGES.find(item => item.packageJson.name === key)) {
            continue;
        }

        const currentVersion = deps[key];
        const newVersion = `^${nextFixedVersion}`;

        if (currentVersion !== newVersion) {
            console.log(`- ${key}@${blue(currentVersion)} => ${key}@${blue(newVersion)}`);
            deps[key] = newVersion;
            processedCount++;
        }
    }

    return processedCount;
}
