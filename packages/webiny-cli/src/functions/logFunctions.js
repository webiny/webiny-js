const chalk = require("chalk");
const listPackages = require("../utils/listPackages");

module.exports = async (functions = null) => {
    functions = functions || (await listPackages("function"));

    if (!functions.length) {
        console.log(chalk.cyan(`No functions detected!`));
        return;
    }

    console.log(chalk.cyan(`The following functions were detected:`));
    console.log(chalk.cyan(`===============================================`));
    functions.forEach((fn, index) => {
        console.log(
            `${index + 1}. ${fn.package.name} ` +
                chalk.cyan(`[${fn.method.toUpperCase()}] ${fn.path}`) +
                ` ${chalk.grey(fn.root)}`
        );
    });
    console.log(chalk.cyan(`===============================================`));
};
