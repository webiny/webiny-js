const { BasePackagesWatcher } = require("./../BasePackagesWatcher");

class NoDeploymentsPackagesWatcher extends BasePackagesWatcher {
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
            const { ZeroPackagesWatcher } = require("./NoDeploymentsZeroPackagesWatcher");
            return ZeroPackagesWatcher;
        }

        if (packagesCount === 1) {
            const {
                NoDeploymentsSinglePackageWatcher
            } = require("./NoDeploymentsSinglePackageWatcher");
            return NoDeploymentsSinglePackageWatcher;
        }

        const {
            NoDeploymentsMultiplePackagesWatcher
        } = require("./NoDeploymentsMultiplePackagesWatcher");
        return NoDeploymentsMultiplePackagesWatcher;
    }
}

module.exports = { NoDeploymentsPackagesWatcher };
