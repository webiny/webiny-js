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
        const packagesCount = this.packages.length;
        if (packagesCount === 0) {
            const { ZeroPackagesWatcher } = require("./ZeroPackagesWatcher");
            return ZeroPackagesWatcher;
        }

        if (packagesCount === 1) {
            const {
                SinglePackageWatcher
            } = require("./SinglePackageWatcher");
            return SinglePackageWatcher;
        }

        const {
            MultiplePackagesWatcher
        } = require("./MultiplePackagesWatcher");
        return MultiplePackagesWatcher;
    }
}

module.exports = { PackagesWatcher };
