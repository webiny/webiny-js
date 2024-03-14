const { BasePackageBuilder } = require("./BasePackageBuilder");

class PackagesBuilder extends BasePackageBuilder {
    async build() {
        const BuilderClass = this.getBuilderClass();

        const builder = new BuilderClass({
            packages: this.packages,
            inputs: this.inputs,
            context: this.context
        });

        await builder.build();
    }

    getBuilderClass() {
        const packagesCount = this.packages.length;
        if (packagesCount === 0) {
            const { ZeroPackagesBuilder } = require("./ZeroPackagesBuilder");
            return ZeroPackagesBuilder;
        }

        if (packagesCount === 1) {
            const { SinglePackageBuilder } = require("./SinglePackageBuilder");
            return SinglePackageBuilder;
        }

        const { MultiplePackagesBuilder } = require("./MultiplePackagesBuilder");
        return MultiplePackagesBuilder;
    }
}

module.exports = { PackagesBuilder };
