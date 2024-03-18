const { BasePackagesBuilder } = require("./BasePackagesBuilder");

class ZeroPackagesBuilder extends BasePackagesBuilder {
    build() {
        // Simply don't do anything. There are no packages to build.
        return;
    }
}

module.exports = { ZeroPackagesBuilder };
