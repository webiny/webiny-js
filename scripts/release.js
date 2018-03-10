#!/usr/bin/env node
const { argv } = require("yargs");

// Load lerna packages
const Repository = require("lerna/lib/Repository");
const PackageUtilities = require("lerna/lib/PackageUtilities");
const packages = PackageUtilities.getPackages(new Repository())
    .filter(pkg => !pkg.isPrivate()) // do not include private packages
    .map(pkg => {
        return {
            name: pkg.name,
            location: pkg.location,
            packageJSON: pkg.toJSON()
        };
    });

// Configure webiny-semantic-release
const wsr = require("webiny-semantic-release");
const config = {
    packages,
    preview: argv.preview || false,
    branch: "development",
    tagFormat: pkg => pkg.name + "@v${version}",
    plugins: [
        wsr.githubVerify(),
        wsr.npmVerify(),
        wsr.analyzeCommits({
            isRelevant: (pkg, commit) => {
                if (commit.message.match(/affects:(.*)/)) {
                    return RegExp.$1
                        .split(",")
                        .map(n => n.trim())
                        .filter(name => pkg.name === name).length;
                }
            }
        }),
        wsr.releaseNotes(),
        // Make sure "main" field does not start with `src/`
        ({ packages, logger }, next) => {
            packages.map(pkg => {
                const json = pkg.packageJSON;
                if (json.main && (json.main.startsWith("src/") || json.main.startsWith("./src/"))) {
                    logger.log(`Updating \`main\` field of %s`, pkg.name);
                    json.main = json.main.replace("src/", "lib/");
                }
            });
            next();
        },
        ({ packages }, next) => {
            packages.map(pkg => {
                if (pkg.nextRelease && pkg.nextRelease.version === "1.0.0") {
                    const date = new Date().toISOString().split("T")[0];
                    pkg.nextRelease.notes = `<a name="1.0.0"></a>\n# 1.0.0 (${date})\n\n\n### Initial release\n\n\n`;
                }
            });
            next();
        },
        wsr.updatePackageJSON(),
        wsr.githubPublish(),
        wsr.npmPublish()
    ]
};

wsr.release(config).catch(e => {
    console.error(e);
    process.exit(1);
});
