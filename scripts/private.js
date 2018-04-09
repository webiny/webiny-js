#!/usr/bin/env node
const { argv } = require("yargs");

if (argv.require) {
    if (Array.isArray(argv.require)) {
        argv.require.map(require);
    } else {
        require(argv.require);
    }
}

// Configure webiny-semantic-release
const wsr = require("./../");

const registry = process.env.NPM_REGISTRY;

const config = {
    preview: argv.preview || false,
    branch: argv.branch || "master",
    ci: false,
    tagFormat: pkg => pkg.name + "@v${version}",
    plugins: [
        wsr.npmVerify({ registry }),
        wsr.analyzeCommits(),
        // TODO: add plugin for checking current latest version on private registry
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
        wsr.updatePackageJSON(),
        ({ packages }, next) => {
            packages.map(pkg => {
                if (pkg.nextRelease.version === "1.0.0") {
                    const date = new Date().toISOString().split("T")[0];
                    pkg.nextRelease.notes = `<a name="1.0.0"></a>\n# 1.0.0 (${date})\n\n\n### Initial release\n\n\n`;
                }
            });
            next();
        },
        wsr.npmPublish({ registry })
    ]
};

wsr.release(config).catch(e => {
    console.error(e);
    process.exit(1);
});
