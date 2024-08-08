const Listr = require("listr");
const { BasePackagesBuilder } = require("./BasePackagesBuilder");
const { gray } = require("chalk");
const { measureDuration } = require("../../utils");

class MultiplePackagesBuilder extends BasePackagesBuilder {
    async build() {
        const packages = this.packages;
        const context = this.context;
        const inputs = this.inputs;

        const getBuildDuration = measureDuration();

        context.info(`Building %s packages...`, packages.length);

        const buildTasks = [];

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            const buildTask = new Promise(async (resolve) => {
                const { env, debug } = inputs;

                const options = {
                    env,
                    debug,
                    cwd: pkg.paths.root,
                    logs: false
                };

                let config = require(pkg.paths.config).default || require(pkg.paths.config);
                if (typeof config === "function") {
                    config = config({ options, context });
                }

                const hasBuildCommand =
                    config.commands && typeof config.commands.build === "function";
                if (!hasBuildCommand) {
                    throw new Error("Build command not found.");
                }

                await config.commands.build(options);
                resolve();
            });

            buildTasks.push({ pkg, task: buildTask });
        }

        const tasks = new Listr(
            buildTasks.map(({ pkg, task }) => {
                return {
                    title: this.getPackageLabel(pkg),
                    task: () => task
                };
            }),
            { concurrent: true, exitOnError: false }
        );

        await tasks.run().catch(err => {
            console.log();
            context.error(`Failed to build all packages. For more details, check the logs below.`);
            console.log();

            err.errors.forEach(({ package: pkg, error }, i) => {
                const number = `${i + 1}.`;
                const name = context.error.hl(pkg.name);
                const relativePath = gray(`(${pkg.paths.relative})`);
                const title = [number, name, relativePath].join(" ");

                console.log(title);
                console.log(error.message);
                console.log();
            });

            throw new Error(`Failed to build all packages.`);
        });

        console.log();

        context.success(`Built ${packages.length} packages in ${getBuildDuration()}.`);
    }

    getPackageLabel(pkg) {
        const pkgName = pkg.name;
        const pkgRelativePath = gray(`(${pkg.paths.relative})`);
        return `${pkgName} ${pkgRelativePath}`;
    }
}

module.exports = { MultiplePackagesBuilder };
