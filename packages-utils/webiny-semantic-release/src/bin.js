#!/usr/bin/env node
import yargs from "yargs";
import semanticRelease from "./index";
import getLernaPackages from "./utils/getLernaPackages";

const { argv } = yargs;

/**
 * By default we handle packages using Lerna and only allow release from `master` branch.
 * Also we use a `default` preset which defines a common set of plugins:
 * Plugins are executed in this exact order:
 * 1. githubVerify
 * 2. npmVerify
 * 3. analyzeCommits
 * 4. updatePackageJson
 * 5. releaseNotes
 * 6. githubPublish
 * 7. npmPublish
 *
 * If you need a custom set of plugins, either create your own preset as a separate npm package
 * or define the `plugins` config array.
 */
semanticRelease({
    ci: argv.ci || true,
    dryRun: argv.dryRun,
    branch: argv.branch || "master",
    packages: getLernaPackages(),
    preset: argv.preset || "default"
}).catch(e => {
    console.log(e);
    process.exit(1);
});
