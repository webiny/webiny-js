const _ = require('lodash');
const Webiny = require('webiny-cli/lib/webiny');
const Plugin = require('webiny-cli/lib/plugin');

class Build extends Plugin {
    constructor() {
        super();
        this.task = 'build';
        this.title = 'Production build';
    }

    init(program) {
        const command = program.command('build <environment>');
        command.description('Build apps using given environment.');
        command.action((environment, cmd) => {
            const config = _.assign({}, cmd.parent.opts(), cmd.opts(), {environment});
            Webiny.runTask('build', config).catch(e => console.log(e));
        }).on('--help', () => {
            console.log();
            console.log('  Examples:');
            console.log();
            console.log('    $ webiny-cli build Production');
            console.log();
            console.log('  Hooks:');
            console.log();
            console.log('   - before-build (config)');
            console.log('   - after-build (config, stats)');
            console.log('   - before-webpack (configs)');
            console.log();
        });
    }

    runTask(config) {
        const Task = require('./task');
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'production';
        }
        return Webiny.dispatch('before-build', {config}).then(() => {
            const task = new Task(config);
            return task.run().then(stats => {
                return Webiny.dispatch('after-build', {config, stats});
            });
        });
    }

    runWizard(config) {
        const Webiny = require('webiny-cli/lib/webiny');
        const inquirer = require('inquirer');
        const yaml = require('js-yaml');

        config.environment = 'Local';
        return this.runTask(config);

        const environments = yaml.safeLoad(Webiny.readFile(Webiny.projectRoot('Configs/Environments.yaml')));
        const choices = Object.keys(environments.Environments);

        return inquirer.prompt([{
            type: 'list',
            name: 'environment',
            message: 'Select an environment to build',
            choices
        }]).then(answers => {
            config.environment = answers.environment;

        });
    }
}

module.exports = Build;