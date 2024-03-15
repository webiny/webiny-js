const { BasePackageBuilder } = require("./BasePackageBuilder");
const { gray } = require("chalk");

class SinglePackageBuilder extends BasePackageBuilder {
    async build() {
        const pkg = this.packages[0];
        const context = this.context;
        const inputs = this.inputs;

        const { env, debug } = inputs;

        const pkgName = pkg.name;
        const pkgRelativePath = gray(`(${pkg.paths.relative})`);
        context.info(`Building %s package...`, `${pkgName} ${pkgRelativePath}`);

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

        const hasBuildCommand = config.commands && typeof config.commands.build === "function";
        if (!hasBuildCommand) {
            throw new Error("Build command not found.");
        }

        await config.commands.build(options);
    }
}

module.exports = { SinglePackageBuilder };
