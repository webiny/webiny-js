import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import _ from 'lodash';
import program from 'commander';
import Navigation from './navigation';
import Dispatcher from './dispatcher';

const { Command } = program;

class Webiny extends Dispatcher {
    constructor() {
        super();
        this.plugins = {};
        this.apps = [];
        this.config = null;
        this.runTask = this.runTask.bind(this);
        this.findFileDepth = 0;

        this.validate = {
            email(value) {
                const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!re.test(value)) {
                    return 'Please enter a valid e-mail';
                }
                return true;
            },
            domain(value) {
                const regex = /^https?:\/\/[\w+-]+(\.\w+)+(:[0-9]+)?$/;
                if (regex.test(value)) {
                    return true;
                }

                if (value.includes('localhost')) {
                    return 'Sorry, localhost is not a valid domain.';
                }

                return 'Please enter a valid domain (e.g. http://domain.app:8001)';
            },
            writable(path) {
                const error = 'Given path is not writable! Please check your permissions or specify a different file path.';
                try {
                    // Check if file exists
                    fs.statSync(path).isFile();
                    try {
                        fs.accessSync(path, fs.W_OK);
                        return true;
                    } catch (err) {
                        return error;
                    }
                } catch (err) {
                    // If file does not exist - try creating it, and remove it on success
                    try {
                        fs.ensureFileSync(path);
                        fs.removeSync(path);
                    } catch (err) {
                        return error;
                    }
                }
                return true;
            }
        };
    }

    getConfig() {
        if (this.config) {
            return this.config;
        }

        try {
            this.config = JSON.parse(this.readFile(this.projectRoot('webiny.json')));
        } catch (e) {
            this.config = {
                lastRun: {
                    apps: [],
                    host: ''
                }
            };
        }
        return this.config;
    }

    saveConfig(config) {
        if (_.has(config, 'lastRun.apps')) {
            config.lastRun.apps = _.uniq(config.lastRun.apps);
        }
        this.writeFile(this.projectRoot('webiny.json'), JSON.stringify(config, null, 4));
        this.config = config;
    }

    getAppRoot() {
        return this.appRoot;
    }

    setAppRoot(appRoot) {
        this.appRoot = path.resolve(this.projectRoot(), appRoot);
        return this;
    }

    setPlugins(plugins) {
        plugins.map(pl => {
            if (!pl.init) {
                throw Error(`${pl.constructor.name} plugin must implement "init()" method`);
            }
            pl.init(program);
            this.plugins[pl.task] = pl;
        });

        return this;
    }

    getPlugins() {
        return this.plugins;
    }

    setHooks(hooks) {
        _.each(hooks, (callbacks, hook) => {
            callbacks.forEach(cb => this.on(hook, cb));
        });

        return this;
    }

    projectRoot(p) {
        if (!p) {
            return process.cwd();
        }

        return path.join(process.cwd(), p);
    }

    success(msg = '') {
        let prefix = '';
        if (msg.startsWith("\n")) {
            prefix = "\n";
            msg = _.trimStart(msg, "\n");
        }
        this.log(prefix + chalk.green('\u2713') + ' ' + msg);
    }

    exclamation(msg = '', extra = null) {
        let prefix = '';
        if (msg.startsWith("\n")) {
            prefix = "\n";
            msg = _.trimStart(msg, "\n");
        }

        this.log(prefix + chalk.red('\u2757') + ' ' + msg);

        if (extra) {
            this.log(extra);
        }
    }

    failure(msg = '', extra = null) {
        let prefix = '';
        if (msg.startsWith("\n")) {
            prefix = "\n";
            msg = _.trimStart(msg, "\n");
        }

        this.log(prefix + chalk.red('\u2718') + ' ' + msg);
        if (extra) {
            this.log('\n');
            this.info('---------------- ERROR DETAILS ---------------');
            this.log(extra);
            this.info('----------------------------------------------');
        }
    }

    log(msg = '\n') {
        console.log(msg);
    }

    warning(msg = '') {
        console.log('[' + chalk.red('WARNING') + ']: ' + msg);
    }

    info(msg = '') {
        let prefix = '';
        if (msg.startsWith("\n")) {
            prefix = "\n";
            msg = _.trimStart(msg, "\n");
        }

        this.log(prefix + chalk.blue('>') + ' ' + msg);
    }

    fileExists(path) {
        try {
            return fs.statSync(path).isFile();
        } catch (err) {
            return false;
        }
    }

    readFile(path) {
        return fs.readFileSync(path, 'utf8');
    }

    writeFile(file, data) {
        fs.outputFileSync(file, data);
    }

    renderMenu() {
        return Navigation.render();
    }

    runTask(task, config = {}, taskOptions = {}) {
        if (Navigation.prompt) {
            Navigation.prompt.ui.close();
            Navigation.prompt = null;
        }

        if (task instanceof Command) {
            // Build config from top level program opts and given task opts
            config = _.assign({}, task.parent.opts(), task.opts());
            task = task.name();
        }

        if (config.app || config.all) {
            const apps = this.getApps();
            config.apps = config.all ? apps : _.filter(apps, a => config.app.indexOf(a.name) > -1);
        }

        const plugin = this.getPlugins()[task];
        if (plugin) {
            return this.dispatch('beforeTask', { task, config }).then(() => {
                return plugin.runTask(config)
                    .then(res => this.dispatch('afterTask', { task, config, data: res }).then(() => {
                        if (!taskOptions.api) {
                            process.exit(res);
                        }
                        _.get(res, 'menu', true) !== false ? this.renderMenu() : null;
                    }))
                    .catch(err => {
                        return this.dispatch('afterTask', { task, config, err }).then(() => {
                            this.log();
                            this.failure('Task execution was aborted due to an error. See details below.', err.stack);
                            if (!taskOptions.api) {
                                process.exit(err.message);
                            }
                            this.renderMenu();
                        });
                    })
            });
        }

        this.failure(`Plugin "${task}" was not found!`);
        process.exit(1);
    }
}

export default new Webiny;