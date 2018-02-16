#!/usr/bin/env node
const semanticRelease = require("semantic-release");
const { argv } = require("yargs");
const Repository = require("lerna/lib/Repository");
const PackageUtilities = require("lerna/lib/PackageUtilities");

function getAllPackages() {
    const repository = new Repository();
    return PackageUtilities.getPackages(repository);
}

const plugins = [];
if (!argv.skipNpm) {
    plugins.push("@semantic-release/npm");
}

if (!argv.skipGithub) {
    plugins.push("@semantic-release/github");
}

const packages = getAllPackages().filter(p => !p.isPrivate());
let chain = Promise.resolve();
packages.map(pkg => {
    chain = chain.then(() => {
        process.chdir(pkg.location);
        return semanticRelease({
            branch: argv.branch || "master",
            dryRun: argv.dryRun || plugins.length < 1,
            tagFormat: [pkg.name, "@", "v${version}"].join(""),
            analyzeCommits: "webiny-semantic-release/plugins/analyzeCommits",
            generateNotes: "webiny-semantic-release/plugins/releaseNotes",
            verifyConditions: plugins,
            publish: plugins,
            success: [],
            fail: []
        });
    });
});

chain.catch(e => {
    console.log(e);
    process.exit(1);
});
