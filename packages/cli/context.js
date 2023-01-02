const fs = require("fs");
const path = require("path");
const { importModule, getProject, PluginsContainer, log, localStorage, noop } = require("./utils");

const project = getProject();

if (!project) {
    console.log(
        `🚨 Couldn't locate "webiny.project.js"! Webiny CLI relies on that file to find the root of a Webiny project.`
    );
    process.exit(1);
}

class Context {
    constructor() {
        this.loadedEnvFiles = {};

        this.version = require("./package.json").version;
        this.project = project;

        // Check if `projectName` was injected properly.
        if (this.project.name === "[PROJECT_NAME]") {
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

        this.plugins = new PluginsContainer();

        this.localStorage = localStorage();

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

    import(name) {
        return importModule(name);
    }

    async loadUserPlugins() {
        if (this.project.config.cli) {
            let plugins = this.project.config.cli.plugins || [];
            if (typeof plugins === "function") {
                plugins = await plugins();
            }

            this.plugins.register(
                ...plugins.map(plugin => {
                    if (typeof plugin === "string") {
                        let loadedPlugin;
                        try {
                            loadedPlugin = require(path.join(this.project.root, plugin)); // Try loading the package from the project's root
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

    log = log.log;
    info = log.info;
    success = log.success;
    debug = process.argv.some(v => v.match("--debug")) ? log.debug : noop;
    warning = log.warning;
    error = log.error;

    resolve(...dir) {
        return path.resolve(this.project.root, ...dir);
    }

    replaceProjectRoot(path) {
        return path.replace(this.project.root, "<projectRoot>").replace(/\\/g, "/");
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
            debug && this.debug(`No environment file found on %s.`, filePath);
            return;
        }

        try {
            require("dotenv").config({ path: filePath });
            debug && this.success(`Loaded environment variables from ${filePath}.`);
            this.loadedEnvFiles[filePath] = true;
        } catch (err) {
            if (debug) {
                this.error(`Could not load env variables from ${filePath}:`);
                this.error(err.message);
                console.log();
            }
        }
    }
}

module.exports = new Context();
