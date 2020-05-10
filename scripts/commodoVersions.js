#!/usr/bin/env node
const path = require("path");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const getPackages = require("get-yarn-workspaces");
const { red, blue, cyan } = require("chalk");
const argv = require("yargs").argv;
const got = require("got");

const COMMODO_PACKAGES = [
    "@commodo/name",
    "@commodo/hooks",
    "@commodo/fields",
    "@commodo/fields-storage",
    "@commodo/fields-storage-ref",
    "@commodo/fields-storage-mongodb",
    "@commodo/fields-storage-soft-delete"
];

const ALLOWED_DIST_TAGS = ["latest", "canary"];

const DIST_TAG = argv.tag || "latest";
const PREVIEW = argv.preview;

/**
 *
 */
(async () => {
    if (!ALLOWED_DIST_TAGS.includes(DIST_TAG)) {
        console.log(
            red(
                `Provided tag "${DIST_TAG}" not allowed (must be one of: ${ALLOWED_DIST_TAGS.join(
                    ", "
                )}).`
            )
        );
        process.exit(1);
    }

    if (PREVIEW) {
        console.log("Running in preview mode, no changes to actual files will be applied.");
    }

    console.log("⏳ Fetching package data from NPM...");
    let npm = {};
    for (let i = 0; i < COMMODO_PACKAGES.length; i++) {
        let p = COMMODO_PACKAGES[i];
        const { body } = await got(`https://registry.npmjs.com/${p}`, { json: true });
        npm[body._id] = body["dist-tags"];
    }

    console.log();

    if (PREVIEW) {
        console.log("🐰 These are the differences in package versions:");
        console.log("==============================================");
    } else {
        console.log("🐰️ These are the changes that were applied to package versions:");
        console.log("============================================================");
    }

    const packages = getPackages();

    for (let i = 0; i < packages.length; i++) {
        const p = packages[i];
        const packageJsonPath = path.join(p, "package.json");
        try {
            const packageJson = await readJson(packageJsonPath);

            if (!mustProcess(packageJson)) {
                continue;
            }

            console.log(`${cyan(packageJson.name)}`);
            const depsCount = processDeps({ deps: packageJson.dependencies, npm });
            const devDepsCount = processDeps({ deps: packageJson.devDependencies, npm });

            if (depsCount || devDepsCount) {
                !PREVIEW && (await writeJson(packageJsonPath, packageJson));
            } else {
                console.log("All up-to-date.");
            }

            console.log();
        } catch {}
    }

    process.exit(0);
})();

function mustProcess(json) {
    if (json.dependencies) {
        for (let key in json.dependencies) {
            if (COMMODO_PACKAGES.includes(key)) {
                return true;
            }
        }
    }

    if (json.devDependencies) {
        for (let key in json.devDependencies) {
            if (COMMODO_PACKAGES.includes(key)) {
                return true;
            }
        }
    }
}

function processDeps({ deps, npm }) {
    let processedCount = 0;

    for (let key in deps) {
        if (!COMMODO_PACKAGES.includes(key)) {
            continue;
        }

        const currentVersion = deps[key];
        const newVersion = "^" + npm[key][DIST_TAG];

        if (currentVersion !== newVersion) {
            console.log(`- ${key}@${blue(currentVersion)} => ${key}@${blue(newVersion)}`);
            deps[key] = newVersion;
            processedCount++;
        }
    }

    return processedCount;
}
