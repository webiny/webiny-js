#!/usr/bin/env node
const description = `By default we only allow release from \`master\` branch.
 Also we use a \`default\` preset which defines a common set of plugins:
 
 1. githubVerify \tverifies GH_TOKEN or GITHUB_TOKEN and repo permissions.
 2. npmVerify \t\tverifies NPM_TOKEN.
 3. analyzeCommits \tanalyzes commit history and determines version type.
 4. updatePackageJson \tupdates package version and versions of dependencies.
 5. releaseNotes \tgenerates release notes for GitHub release.
 6. githubPublish \tpublishes a new release to GitHub.
 7. npmPublish \t\tpublishes the package to npm.
 
 If you need a custom set of plugins, either create your own preset as a separate npm package or define the \`plugins\` array.`;

const yargs = require("yargs");
yargs
    .usage("$0 [options]", description)
    .option("branch", {
        describe: "Allow release only from this branch.",
        default: "master"
    })
    .option("ci", {
        describe: "Execute release ONLY in a CI environment.",
        default: true
    })
    .option("project", {
        describe: "Project type (for custom structures use Node API to configure the release).",
        choices: ["single", "lerna"]
    })
    .option("preview", {
        describe: "Run release preview without actually performing a release.",
        default: false
    })
    .option("preset", {
        describe:
            "Use given preset as a source of plugins. A preset is a module that exports `plugins` array (named export).",
        default: "default"
    })
    .option("require", {
        describe: "Require the given module (ex: `babel-register`)."
    })
    .version()
    .help();

const { argv } = yargs;

if (argv.require) {
    if (Array.isArray(argv.require)) {
        argv.require.map(require);
    } else {
        require(argv.require);
    }
}

const { default: release, getSinglePackage, getLernaPackages } = require("./../");

release({
    ci: argv.ci,
    preview: argv.preview,
    branch: argv.branch,
    packages: argv.project === "single" ? getSinglePackage() : getLernaPackages(),
    preset: argv.preset
}).catch(e => {
    console.log(e);
    process.exit(1);
});
