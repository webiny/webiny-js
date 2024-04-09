class BasePackagesWatcher {
    constructor({ packages, inputs, context }) {
        this.packages = packages;
        this.inputs = inputs;
        this.context = context;
    }

    async watch() {
        throw new Error("Not implemented.");
    }
}

module.exports = { BasePackagesWatcher };
