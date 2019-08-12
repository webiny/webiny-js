const path = require("path");
const execa = require("execa");
const webpack = require("webpack");
const get = require("lodash.get");

class BuildFunctions {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.hooks = {
            "before:offline:start:init": this.buildAndWatchFunctions.bind(this),
            "before:deploy:function:packageFunction": this.buildFunctions.bind(this),
            "before:package:createDeploymentArtifacts": this.buildFunctions.bind(this)
        };
    }

    async buildAndWatchFunctions() {
        /*console.log("====> Attach @babel/register <====");
        require("@babel/register")({
            only: [/packages/],
            configFile: path.resolve("babel.config.js")
        });

        return;*/

        this.serverless.cli.log("Building functions...");
        const compiler = this.getCompiler();

        let firstRun = true;

        return new Promise((resolve, reject) => {
            compiler.watch(
                {
                    aggregateTimeout: 300,
                    poll: 1000
                },
                (err, multiStats) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    multiStats.stats.forEach(stats => {
                        console.log(
                            stats.toString({
                                colors: true
                            })
                        );
                    });

                    if (firstRun) {
                        firstRun = false;
                        this.serverless.cli.log("Watching for changes...");
                        resolve();
                    }
                }
            );
        });
    }

    async buildFunctions() {
        const fn = this.options["function"];

        const functions = fn ? [fn] : Object.keys(this.serverless.service.functions);
        for (let i = 0; i < functions.length; i++) {
            const fn = functions[i];
            const { webiny } = this.serverless.service.functions[fn];
            const cwd = path.resolve("packages", fn);
            if (!webiny || !webiny.ssr) {
                this.serverless.cli.log(`Building "${fn}" function...`);
                await execa("yarn", ["build"], { cwd, stdio: "inherit" });
            } else {
                this.serverless.cli.log(`Building "${fn}" app...`);
                await execa("yarn", ["build"], { cwd, stdio: "inherit" });
                this.serverless.cli.log(`Building "${fn}" SSR bundle...`);
                await execa("yarn", ["build:ssr"], { cwd, stdio: "inherit" });
                this.serverless.cli.log(`Building "${fn}" proxy handler...`);
                await execa("yarn", ["build:handler"], { cwd, stdio: "inherit" });
            }
        }
    }

    getCompiler() {
        const functions = Object.keys(this.serverless.service.functions);

        const configs = [];
        functions.forEach(fn => {
            const isSpa = get(this.serverless.service.functions[fn], "webiny.spa", false);
            if (isSpa) {
                configs.push(require(path.resolve("packages", fn, "handler", "webpack.config.js")));
            } else {
                configs.push(require(path.resolve("packages", fn, "webpack.config.js")));
            }
        });

        return webpack(configs);
    }
}

module.exports = BuildFunctions;
