// @flow
import { getPlugins } from "webiny-plugins";
import chalk from "chalk";
const { log } = console;

export default async (context: Object) => {
    const start = +new Date();
    const plugins = getPlugins("install");

    log(chalk.cyan("Welcome to Webiny installer!"));
    log(chalk.cyan("The following will be installed:"));

    plugins.forEach(plugin => {
        log("➜ " + plugin.meta.name);
    });

    log(chalk.cyan("\nInstalling..."));

    setTimeout(async () => {
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            try {
                await plugin.install(context);
            } catch (e) {
                log(chalk.red(`An error occurred while installing ${plugin.meta.name}!`));
                log(e);
            }
        }

        const end = (+new Date() - start) / 1000;
        log(chalk.green(`Installation completed in ${end}s.`));
        process.exit(0);
    }, 500);
};
