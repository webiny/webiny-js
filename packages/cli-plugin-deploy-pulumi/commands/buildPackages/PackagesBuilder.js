const { BasePackageBuilder } = require("./BasePackageBuilder");
const { MultiplePackagesBuilder } = require("./MultiplePackagesBuilder");
const { SinglePackageBuilder } = require("./SinglePackageBuilder");
const { ZeroPackagesBuilder } = require("./ZeroPackagesBuilder");

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
            return ZeroPackagesBuilder;
        }

        if (packagesCount === 1) {
            return SinglePackageBuilder;
        }

        return MultiplePackagesBuilder;
    }
}

module.exports = { PackagesBuilder };
