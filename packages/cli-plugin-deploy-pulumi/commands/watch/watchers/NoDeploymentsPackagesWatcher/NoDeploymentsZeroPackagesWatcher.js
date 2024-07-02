const { BasePackagesWatcher } = require("./../BasePackagesWatcher");

class NoDeploymentsZeroPackagesWatcher extends BasePackagesWatcher {
    watch() {
        // Simply don't do anything. There are no packages to watch.
        return;
    }
}

module.exports = { NoDeploymentsZeroPackagesWatcher };
