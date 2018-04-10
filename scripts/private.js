#!/usr/bin/env node
const { argv } = require("yargs");
const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const packages = require("./utils/lernaPackages");

if (argv.require) {
    if (Array.isArray(argv.require)) {
        argv.require.map(require);
    } else {
        require(argv.require);
    }
}

// Configure 'webiny-semantic-release
const wsr = require("webiny-semantic-release");

const registry = process.env.NPM_REGISTRY;

const toPublish = [
    //"webiny-api-cms",
    "webiny-api-security",
    "webiny-api",
    "webiny-app-admin",
    //"webiny-app-cms",
    //"webiny-app-security-admin",
    "webiny-app-security",
    "webiny-app-ui",
    "webiny-app",
    "webiny-compose",
    "webiny-data-extractor",
    "webiny-entity-memory",
    "webiny-entity-mysql",
    "webiny-entity",
    "webiny-file-storage-local",
    "webiny-file-storage-s3",
    "webiny-file-storage",
    "webiny-i18n-react",
    "webiny-i18n",
    "webiny-jimp",
    "webiny-model",
    "webiny-mysql-connection",
    "webiny-react-router",
    "webiny-scripts",
    "webiny-service-manager",
    "webiny-sql-table-mysql",
    "webiny-sql-table-sync",
    "webiny-sql-table",
    "webiny-validation"
];

const config = {
    preview: argv.preview || false,
    branch: argv.branch || "master",
    ci: false,
    tagFormat: pkg => pkg.name + "@v${version}",
    packages: packages().filter(pkg => toPublish.includes(pkg.name)),
    plugins: [
        ({ packages }, next) => {
            packages.map(pkg => {
                pkg.jsonBackup = { ...pkg.package };
            });
            next();
        },
        wsr.npmVerify({ registry }),
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
            packages.filter(pkg => pkg.nextRelease).map(pkg => {
                const json = pkg.package;
                if (json.main && (json.main.startsWith("src/") || json.main.startsWith("./src/"))) {
                    logger.log(`Updating \`main\` field of %s`, pkg.name);
                    json.main = json.main.replace("src/", "lib/");
                }
            });
            next();
        },
        wsr.updatePackage(),
        ({ packages }, next) => {
            packages.filter(pkg => pkg.nextRelease).map(pkg => {
                if (pkg.nextRelease.version === "1.0.0") {
                    const date = new Date().toISOString().split("T")[0];
                    pkg.nextRelease.notes = `<a name="1.0.0"></a>\n# 1.0.0 (${date})\n\n\n### Initial release\n\n\n`;
                }
            });
            next();
        },
        wsr.npmPublish({ registry }),
        async ({ packages, config }, next) => {
            if (config.preview) {
                return;
            }

            for (let i = 0; i < packages.length; i++) {
                const pkg = packages[i];
                if (!pkg.nextRelease || !pkg.nextRelease.gitTag) {
                    continue;
                }

                fs.writeJsonSync(path.join(pkg.location, "package.json"), pkg.jsonBackup, {
                    spaces: 2
                });
                await execa("git", ["tag", pkg.nextRelease.gitTag]);
            }
            next();
        }
    ]
};

wsr.release(config).catch(e => {
    console.error(e);
    process.exit(1);
});
