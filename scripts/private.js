// @flowIgnore
const { argv } = require("yargs");
require("dotenv").config();
const path = require("path");
const readPkg = require("read-pkg");
const globby = require("globby");
const execa = require("execa");

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
    "webiny-api",
    "webiny-api-cms",
    "webiny-app",
    "webiny-app-admin",
    "webiny-app-cms",
    "webiny-cms-editor",
    "webiny-ui",
    "webiny-compose",
    "webiny-data-extractor",
    "webiny-entity-memory",
    "webiny-entity-mysql",
    "webiny-entity",
    "webiny-file-storage-local",
    "webiny-file-storage-s3",
    "webiny-file-storage",
    "webiny-form",
    "webiny-i18n-react",
    "webiny-i18n",
    "webiny-jimp",
    "webiny-model",
    "webiny-mysql-connection",
    "webiny-react-router",
    "webiny-service-manager",
    "webiny-sql-table-mysql",
    "webiny-sql-table-sync",
    "webiny-sql-table",
    "webiny-validation"
];

// Get packages to process
const packages = globby
    .sync("build/node_modules/*", { onlyDirectories: true, cwd: process.cwd() })
    .map(dir => {
        const pkg = readPkg.sync({ cwd: dir, normalize: false });
        return {
            name: pkg.name,
            location: path.join(process.cwd(), dir),
            package: pkg
        };
    })
    .filter(pkg => !pkg.package.private && toPublish.includes(pkg.name));

// Release config
const config = {
    preview: argv.preview || false,
    branch: argv.branch || "master",
    ci: false,
    tagFormat: pkg => pkg.name + "@v${version}",
    packages,
    plugins: [
        wsr.npmVerify({ registry }),
        wsr.analyzeCommits({
            isRelevant: (pkg, commit) => {
                if (commit.message.match(/affects: ((?:.+[\n\r]?)+)/gm)) {
                    return RegExp.$1
                        .split(",")
                        .map(n => n.trim())
                        .filter(name => pkg.name === name).length;
                }
            }
        }),
        wsr.releaseNotes(),
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
        // This following plugin is only for Webiny monorepo
        async ({ packages, config }, next) => {
            if (config.preview) {
                return;
            }

            for (let i = 0; i < packages.length; i++) {
                const pkg = packages[i];
                if (!pkg.nextRelease || !pkg.nextRelease.gitTag) {
                    continue;
                }

                await execa("git", ["tag", pkg.nextRelease.gitTag]);
            }
            next();
        }
    ]
};

wsr.release(config).catch(e => {
    // eslint-disable-next-line
    console.error(e);
    process.exit(1);
});
