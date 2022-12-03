const yargs = require("yargs");
const fetch = require("node-fetch");
const pRetry = require("p-retry");
const semver = require("semver");
const execa = require("execa");
const loadJSON = require("load-json-file");
const writeJSON = require("write-json-file");

/**
 * Release scenarios:
 *
 * 1) branch: "stable"; tag: "beta"; graduate to "latest".
 *  - get "beta" version from NPM
 *  - get "latest" version from NPM
 *  - use the more recent version to generate "lerna.json"
 *
 *
 * 2) branch: "next"; tag: "unstable".
 *  - version is generated using commit hash, NPM is not involved.
 *
 * 3) branch: any; tag: "next" (CI testing)
 *  - version is irrelevant, we can easily use the commit hash to generate the version
 */

(async () => {
    const { tag } = yargs.argv;
    await release(tag);
})();

async function release(tag) {
    logInfo(`Attempting to release tag "${tag}"`);

    // Determine current version
    const tags = await getTags();
    const version = getMostRecentVersion([tags["latest"], tags[tag]].filter(Boolean));
    logInfo(`Current version is "${version}"`);

    // Generate `lerna.json` using `example.lerna.json`.
    const lernaJSON = await loadJSON("example.lerna.json");
    lernaJSON.version = version;
    await writeJSON("lerna.json", lernaJSON);
    console.log(`✅️ Lerna ready.`);

    // Run `lerna` to version packages
    const lernaArgs = [
        "lerna",
        "version",
        "--conventional-prerelease",
        "--force-publish",
        "--preid",
        "beta",
        "--no-changelog",
        "--no-git-tag-version",
        "--no-push"
        // "--yes"
    ];

    await execa("yarn", lernaArgs, { stdio: "inherit" });
}

async function getTags() {
    const getVersion = async () => {
        const res = await fetch(`https://registry.npmjs.org/@webiny/cli`);
        const json = await res.json();

        return json["dist-tags"];
    };

    return pRetry(getVersion, { retries: 5 });
}

function getMostRecentVersion(versions) {
    const { coerce, sort } = semver;
    return sort(versions.map(version => coerce(version)))
        .pop()
        .toString();
}

function logInfo(message) {
    console.log(`ℹ️ ${message}`);
}
