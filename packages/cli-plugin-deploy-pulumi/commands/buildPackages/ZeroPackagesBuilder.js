const { BasePackagesBuilder } = require("./BasePackagesBuilder");

class ZeroPackagesBuilder extends BasePackagesBuilder {
    build() {
        // Simply don't do anything. There are no packages to build.
        this.context.info(`No packages to build.`);
    }
}

module.exports = { ZeroPackagesBuilder };
