class BasePackageBuilder {
    constructor({ packages, inputs, context }) {
        this.packages = packages;
        this.inputs = inputs;
        this.context = context;
    }

    async build() {
        throw new Error("Not implemented.");
    }
}

module.exports = { BasePackageBuilder };
