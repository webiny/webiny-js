const { BasePackagesWatcher } = require("./BasePackagesWatcher");

class PackagesWatcher extends BasePackagesWatcher {
    async watch() {
        const WatcherClass = this.getWatcherClass();

        const watcher = new WatcherClass({
            packages: this.packages,
            inputs: this.inputs,
            context: this.context
        });

        await watcher.watch();
    }

    getWatcherClass() {
        if (!this.inputs.deploy) {
            const {
                NoDeploymentsPackagesWatcher
            } = require("./NoDeploymentsPackagesWatcher/NoDeploymentsPackagesWatcher");
            return NoDeploymentsPackagesWatcher;
        }

        throw new Error("Not implemented.");
    }
}

module.exports = { PackagesWatcher };
