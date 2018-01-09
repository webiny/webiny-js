class Plugin {
    constructor(config) {
        this.config = config;
        this.title = '[ undefined title ]';
        this.task = '[ undefined task ]';
    }

    init(program) {
        // Add `program` options and help if you want to enable running this plugin from command line
    }

    runTask(config) {
        // Override to implement
    }

    runWizard(config) {
        return this.runTask(config);
    }
}

module.exports = Plugin;