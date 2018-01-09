const _ = require('lodash');
const Webiny = require('webiny-cli/lib/webiny');
const Plugin = require('webiny-cli/lib/plugin');

class Develop extends Plugin {
    constructor(config) {
        super(config);

        this.task = 'develop';
        this.title = 'Develop! (watches for file changes and rebuilds apps for you)';
    }

    init(program) {
        const command = program.command('develop');
        command.description('Build and watch apps for changes.');
        command.action(cmd => {
            const config = _.assign({}, cmd.parent.opts(), cmd.opts());
            Webiny.runTask('develop', config);
        }).on('--help', () => {
            console.log();
            console.log('  Examples:');
            console.log();
            console.log('    $ webiny-cli develop');
            console.log();
        });
    }


    runTask() {
        const Task = require('./task');

        process.env.NODE_ENV = 'development';
        const task = new Task(this.config);
        return task.run();
    }
}

module.exports = Develop;