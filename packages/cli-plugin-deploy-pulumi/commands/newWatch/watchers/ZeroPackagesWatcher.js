const { BasePackagesWatcher } = require("./BasePackagesWatcher");

class ZeroPackagesWatcher extends BasePackagesWatcher {
    watch() {
        // Simply don't do anything. There are no packages to watch.
        return;
    }
}

module.exports = { ZeroPackagesWatcher };
