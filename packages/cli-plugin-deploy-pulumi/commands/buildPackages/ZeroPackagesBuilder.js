const { BasePackageBuilder } = require("./BasePackageBuilder");

class ZeroPackagesBuilder extends BasePackageBuilder {
    build() {
        this.context.info(`No packages to build...`);
    }
}

module.exports = { ZeroPackagesBuilder };
