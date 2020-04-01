const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const { GetEnvVars } = require("env-cmd");
const { PluginsContainer } = require("@webiny/plugins");
const debug = require("debug")("webiny");

const projectRoot = process.cwd();

class Context {
    constructor() {
        this.paths = {
            projectRoot,
            packagesPath: this.resolve("packages")
        };

        this.plugins = new PluginsContainer();
    }

    log(...args) {
        debug(...args);
    }

    info(...args) {
        debug(...args);
    }

    debug(...args) {
        debug(...args);
    }

    error(...args) {
        debug(...args);
    }

    resolve(...dir) {
        return path.resolve(projectRoot, ...dir);
    }

    replaceProjectRoot(path) {
        return path.replace(projectRoot, "<projectRoot>").replace(/\\/g, "/");
    }

    async loadEnv(envPath, env, { debug = false }) {
        if (fs.existsSync(envPath)) {
            const envConfig = await GetEnvVars({
                rc: {
                    environments: ["default", env],
                    filePath: envPath
                }
            });

            Object.assign(process.env, envConfig);
            if (debug) {
                console.log(
                    `💡 Loaded ${green(env)} environment from ${green(
                        this.replaceProjectRoot(envPath)
                    )}...`
                );
            }
        }
    }
}

module.exports = new Context();
