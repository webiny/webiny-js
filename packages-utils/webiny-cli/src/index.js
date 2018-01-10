#! /usr/bin/env node
import program from 'commander';
import _ from 'lodash';
import chalk from 'chalk';
import Webiny from './webiny';

class WebinyCli {
    constructor(config = {}) {

        this.version = JSON.parse(Webiny.readFile(__dirname + '/../package.json')).version;

        const cliConfig = Webiny.projectRoot('webiny-cli.js');
        if (!Object.keys(config).length && Webiny.fileExists(cliConfig)) {
            config = require(cliConfig);
        }

        Webiny.setAppRoot(config.appRoot || 'Client');
        Webiny.setPlugins(config.plugins || []);
        Webiny.setHooks(config.hooks || {});

        if (!Object.keys(Webiny.getPlugins()).length) {
            Webiny.failure(`No plugins were configured. Configure the plugins in ${chalk.magenta('webiny-cli.js')} in your project root.`);
            process.exit(0);
        }

        program
            .version(this.version)
            .description([
                'Webiny CLI tool will help you manage your project from development to deployment.',
                'It supports plugins so you are welcome to develop new plugins for your project and connect to the existing plugins using hooks.',
                'Run without arguments to enter GUI mode.',
                '',
                'Visit https://www.webiny.com/ for tutorials and documentation.'
            ].join('\n  '))
            .option('--show-timestamps [format]', 'Show timestamps next to each console message');

        program
            .command('*', null, {noHelp: true})
            .action(cmd => {
                Webiny.failure(`${chalk.magenta(cmd)} is not a valid command. Run ${chalk.magenta('webiny-cli -h')} to see all available commands.`);
                process.exit(1);
            });
    }

    run() {
        program.parse(process.argv);

        if (program.showTimestamps) {
            require('console-stamp')(console, _.isString(program.showTimestamps) ? program.showTimestamps : 'HH:MM:ss.l');
        }

        if (program.args.length === 0) {
            return Webiny.renderMenu();
        }
    }
}

export default WebinyCli;