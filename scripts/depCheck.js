/* eslint-disable */
const { argv } = require("yargs");
const chalk = require("chalk");
const args = { dirs: argv._ };
const checkPackage = require("./depCheck/checkPackage");

const checks = [];
for (let i = 0; i < args.dirs.length; i++) {
    let dir = args.dirs[i];
    checks.push(checkPackage({ dir }));
}

Promise.all(checks).then(results => {
    const packagesWithErrors = results.filter(r => r.errors.count);
    if (packagesWithErrors.length === 0) {
        console.log(chalk.green("Dependencies looking good!"));
        return process.exit(0);
    }

    console.log(chalk.red(`Source and dependencies listed in "package.json" file not synced:`));
    packagesWithErrors.forEach((pckg, index) => {
        console.log(chalk.gray(`${index + 1}. ${pckg.packageJson.name} (${pckg.dir})`));

        if (pckg.errors.deps.src.length) {
            console.log(chalk.cyan("[src] Source code"));
            pckg.errors.deps.src.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.dependencies.length) {
            console.log(chalk.cyan("[package.json] dependencies:"));
            pckg.errors.deps.dependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.devDependencies.length) {
            console.log(chalk.cyan("[package.json] devDependencies:"));
            pckg.errors.deps.devDependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }

        if (pckg.errors.deps.peerDependencies.length) {
            console.log(chalk.cyan("[package.json] peerDependencies:"));
            pckg.errors.deps.peerDependencies.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }
    });

    process.exit(1);
});
