const { BasePackageBuilder } = require("./BasePackageBuilder");

class ZeroPackageBuilder extends BasePackageBuilder {
    build() {
        // Simply don't do anything. There are no packages to build.
        return;
    }
}

module.exports = { ZeroPackageBuilder };
