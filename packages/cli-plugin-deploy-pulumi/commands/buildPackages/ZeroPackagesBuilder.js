const { BasePackageBuilder } = require("./BasePackageBuilder");

class ZeroPackagesBuilder extends BasePackageBuilder {
    build() {
        // Simply don't do anything. There are no packages to build.
        return;
    }
}

module.exports = { ZeroPackagesBuilder };
