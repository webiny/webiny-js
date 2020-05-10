#!/usr/bin/env node
const path = require("path");
const readJson = require("load-json-file");
const getPackages = require("get-yarn-workspaces");
const { green, blue, red } = require("chalk");
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

/**
 * This script prints all @webiny packages and shows its @webiny dependencies.
 */
(async () => {
    const DIST_TAG = argv.tag || "latest";
    console.log(DIST_TAG);

    let npmData = [];
    for (let i = 0; i < COMMODO_PACKAGES.length; i++) {
        let p = COMMODO_PACKAGES[i];
        const response = await got(`https://registry.npmjs.com/${p}`, { json: true });
        npmData.push({
            name: response.body._id,
            distTags: response.body["dist-tags"]
        });
    }

    const packages = getPackages().filter(p => !p.includes("sample-project/"));

    for (let i = 0; i < packages.length; i++) {
        const p = packages[i];
        try {
            const json = await readJson(path.join(p, "package.json"));
            console.log(`${json.name}@${blue(json.version)}`);
            Object.keys(json.dependencies).forEach(key => {
                if (!key.startsWith("@commodo")) {
                    return;
                }

                json.dependencies[key] =
                console.log(`- ${key}@${green(json.dependencies[key])}`);
            });
            console.log();
        } catch (er) {
            console.log(`${blue(">")} ${er.message} in ${red(path.basename(p))}!`);
        }
    }

    process.exit(0);
})();
