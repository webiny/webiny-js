import inquirer from 'inquirer';
import _ from 'lodash';
import Webiny from './webiny';

class Menu {
    render() {
        const choices = [];
        _.each(Webiny.getPlugins(), (pl, name) => {
            choices.push({ name: pl.title, value: name });
        });

        // Output a blank line
        Webiny.log('');
        this.prompt = inquirer.prompt([{
            type: 'list',
            name: 'task',
            message: 'What would you like to do?',
            choices,
            filter: val => val.toLowerCase()
        }]);

        return this.prompt.then(answers => {
            return this.runTask(answers.task, {});
        }).catch(err => {
            if (_.isString(err)) {
                Webiny.failure(err);
            } else {
                Webiny.failure(err.message, err.stack);
            }
            this.render();
        });
    }

    runTask(task, config) {
        return Webiny.dispatch('beforeTask', { task, config }).then(() => {
            Webiny.getPlugins()[task].runWizard(config)
                .then(res => {
                    return Webiny.dispatch('afterTask', { task, config, data: res }).then(() => {
                        return _.get(res, 'menu', true) && this.render();
                    })
                })
                .catch(err => {
                    return Webiny.dispatch('afterTask', { task, config, err }).then(() => {
                        Webiny.log();
                        Webiny.failure('Task execution was aborted due to an error. See details below.', err.stack);
                        if (!config.api) {
                            process.exit(err.message);
                        }
                        this.render();
                    });
                });
        });
    }
}


export default new Menu();