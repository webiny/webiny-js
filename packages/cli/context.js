const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const findUp = require("find-up");
const { PluginsContainer } = require("@webiny/plugins");

const webinyRootPath = findUp.sync("webiny.root.js");
if (!webinyRootPath) {
    console.log(
        `🚨 Couldn't locate "webiny.root.js"! Webiny CLI relies on that file to find the root of a Webiny project.`
    );
    process.exit(1);
}
const projectRoot = path.dirname(webinyRootPath);

// Create a random color prefix for the duration of the process
const logPrefix = chalk.hex("#fa5a28").bold("webiny");

const webinyLog = (first = "", ...args) => {
    if (typeof first === "string") {
        first = logPrefix + ": " + first;
    }

    console.log(first, ...args);
};

class Context {
    constructor() {
        this.loadedEnvFiles = {};

        this.paths = {
            projectRoot
        };

        this.config = require(path.join(projectRoot, "webiny.root.js"));

        // Check if `projectName` was injected properly
        if (this.config.projectName === "[PROJECT_NAME]") {
            console.log(
                [
                    "",
                    "🚨 IMPORTANT 🚨",
                    "Looks like your project was not bootstrapped correctly! We recommend creating a new project from scratch.",
                    "If you see errors during project creation, please report them to us:",
                    "🔗 Github:\thttps://github.com/webiny/webiny-js",
                    "🔗 Slack:\thttps://www.webiny.com/slack",
                    ""
                ].join("\n")
            );
            process.exit(1);
        }

        this.projectName = this.config.projectName;
        this.plugins = new PluginsContainer();
        this.onExitCallbacks = [];

        let onExitProcessed = false;
        process.on("SIGINT", async () => {
            if (onExitProcessed) {
                return;
            }

            onExitProcessed = true;

            for (let i = 0; i < this.onExitCallbacks.length; i++) {
                await this.onExitCallbacks[i]("SIGINT");
            }

            process.exit(1);
        });
    }

    onExit(callback) {
        this.onExitCallbacks.push(callback);
    }

    loadUserPlugins() {
        if (this.config.cli) {
            const plugins = this.config.cli.plugins || [];
            this.plugins.register(
                ...plugins.map(plugin => {
                    if (typeof plugin === "string") {
                        let loadedPlugin;
                        try {
                            loadedPlugin = require(path.join(this.paths.projectRoot, plugin)); // Try loading the package from the project's root
                        } catch {
                            // If it fails, perhaps the user still has the package installed somewhere locally...
                            loadedPlugin = require(plugin);
                        }
                        return loadedPlugin;
                    }
                    return plugin;
                })
            );
        }
    }

    log(...args) {
        webinyLog(...args);
    }

    info(...args) {
        webinyLog(...args);
    }

    debug(...args) {
        webinyLog(...args);
    }

    error(...args) {
        webinyLog(...args);
    }

    resolve(...dir) {
        return path.resolve(projectRoot, ...dir);
    }

    replaceProjectRoot(path) {
        return path.replace(projectRoot, "<projectRoot>").replace(/\\/g, "/");
    }

    /**
     * Uses `dotenv` lib to load env files, by accepting a simple file path.
     * @param filePath
     * @param debug
     * @returns {Promise<void>}
     */
    async loadEnv(filePath, { debug = false } = {}) {
        if (this.loadedEnvFiles[filePath]) {
            return;
        }

        if (!fs.existsSync(filePath)) {
            debug && console.log(chalk.yellow(`ⅹ No environment file found on ${filePath}.`));
            return;
        }

        try {
            require("dotenv").config({ path: filePath });
            debug && console.log(chalk.green(`✔ Loaded environment variables from ${filePath}.`));
            this.loadedEnvFiles[filePath] = true;
        } catch (err) {
            if (debug) {
                console.log(chalk.red(`ⅹ️ Could not load env variables from ${filePath}:`));
                console.log(chalk.red(`   ${err.message}`));
                console.log();
            }
        }
    }
}

module.exports = new Context();
