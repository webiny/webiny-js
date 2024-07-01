const { BasePackagesWatcher } = require("./../BasePackagesWatcher");

class NoDeploymentsSinglePackageWatcher extends BasePackagesWatcher {
    async watch() {
        const pkg = this.packages[0];
        const context = this.context;
        const inputs = this.inputs;

        const { env, debug } = inputs;

        const options = {
            env,
            debug,
            cwd: pkg.paths.root,

            // Not much sense in turning off logs when a single package is being built.
            logs: true
        };

        let config = require(pkg.paths.config).default || require(pkg.paths.config);
        if (typeof config === "function") {
            config = config({ options, context });
        }

        const hasWatchCommand = config.commands && typeof config.commands.watch === "function";
        if (!hasWatchCommand) {
            throw new Error("Watch command not found.");
        }

        await config.commands.watch(options);
    }
}

module.exports = { NoDeploymentsSinglePackageWatcher };
