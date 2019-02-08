/* eslint-disable */
const { argv } = require("yargs");
const chalk = require("chalk");
const checkPackage = require("./checkDep/checkPackage");

const config = {
    dirs: [],
    ignore: {
        src: [],
        dependencies: [],
        devDependencies: [],
        peerDependencies: []
    }
};

if (argv.config) {
    Object.assign(config, require(process.cwd() + "/" + argv.config));
}

if (argv._.length) {
    config.dirs = argv._;
}

const checks = config.dirs.map(dir => checkPackage({ dir, config }));

Promise.all(checks).then(results => {
    const packagesWithErrors = results.filter(r => r.errors.count);
    if (packagesWithErrors.length === 0) {
        return process.exit(0);
    }

    console.log(chalk.red(`Source and dependencies listed in "package.json" file not synced:`));
    packagesWithErrors.forEach((pckg, index) => {
        console.log(chalk.red(`${index + 1}. ${pckg.packageJson.name} (${pckg.dir})`));

        if (pckg.errors.deps.src.length) {
            console.log(chalk.gray("[src] Source code"));
            pckg.errors.deps.src.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.dependencies.length) {
            console.log(chalk.gray("[package.json] dependencies:"));
            pckg.errors.deps.dependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.devDependencies.length) {
            console.log(chalk.gray("[package.json] devDependencies:"));
            pckg.errors.deps.devDependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.peerDependencies.length) {
            console.log(chalk.gray("[package.json] peerDependencies:"));
            pckg.errors.deps.peerDependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        console.log();
    });

    process.exit(1);
});
