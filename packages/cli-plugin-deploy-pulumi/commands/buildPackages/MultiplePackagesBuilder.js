const path = require("path");
const { Worker } = require("worker_threads");
const Listr = require("listr");
const { BasePackageBuilder } = require("./BasePackageBuilder");
const { gray } = require("chalk");

class MultiplePackagesBuilder extends BasePackageBuilder {
    async build() {
        const packages = this.packages;
        const context = this.context;
        const inputs = this.inputs;

        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000 + "s";
        };

        const { env, variant, debug } = inputs;

        context.info(`Building %s packages...`, packages.length);

        const buildTasks = [];

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            buildTasks.push({
                pkg: pkg,
                task: new Promise((resolve, reject) => {
                    const enableLogs = inputs.logs === true;

                    const workerData = {
                        options: {
                            env,
                            variant,
                            debug,
                            logs: enableLogs
                        },
                        package: { ...pkg.paths }
                    };

                    const worker = new Worker(path.join(__dirname, "./worker.js"), {
                        workerData,
                        stderr: true,
                        stdout: true
                    });

                    worker.on("message", threadMessage => {
                        const { type, stdout, stderr, error } = JSON.parse(threadMessage);

                        const result = {
                            package: pkg,
                            stdout,
                            stderr,
                            error,
                            duration: getDuration()
                        };

                        if (type === "error") {
                            reject(result);
                            return;
                        }

                        if (type === "success") {
                            resolve(result);
                        }
                    });
                })
            });
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
            console.log()
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

        console.log()

        context.success(
            `Successfully built %s packages in %s.`,
            packages.length,
            getDuration()
        );
    }

    getPackageLabel(pkg) {
        const pkgName = pkg.name;
        const pkgRelativePath = gray(`(${pkg.paths.relative})`);
        return `${pkgName} ${pkgRelativePath}`;
    }
}

module.exports = { MultiplePackagesBuilder };
