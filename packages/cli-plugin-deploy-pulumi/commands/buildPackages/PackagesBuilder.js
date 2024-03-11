const { BasePackageBuilder } = require("./BasePackageBuilder");
const { MultiplePackagesBuilder } = require("./MultiplePackagesBuilder");
const { SinglePackageBuilder } = require("./SinglePackageBuilder");
const { ZeroPackagesBuilder } = require("./ZeroPackagesBuilder");

class PackagesBuilder extends BasePackageBuilder {
    async build() {
        let BuilderClass = ZeroPackagesBuilder;

        this.packages = [this.packages[0]];
        if (this.packages.length === 1) {
            BuilderClass = SinglePackageBuilder;
        } else {
            BuilderClass = MultiplePackagesBuilder;
        }

        const builder = new BuilderClass({
            packages: this.packages,
            inputs: this.inputs,
            context: this.context
        });

        await builder.build();
    }
}

module.exports = { PackagesBuilder };
