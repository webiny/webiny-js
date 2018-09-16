// @flow
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import { schema } from "./graphql";
import createHandler from "./graphql/createHandler";
import chalk from "chalk";
import type { AppType, LambdaEvent } from "./../types";

class Api {
    handler: Function;
    config: Object;
    services: ServiceManager;
    namespace: cls$Namespace;
    apps: Array<AppType>;

    constructor() {
        this.config = {};
        this.services = new ServiceManager();
        this.apps = [];
    }

    getContext(): ?LambdaEvent {
        if (!this.namespace) {
            return null;
        }
        return this.namespace.get("context");
    }

    configure(config: Object): Api {
        this.config = config;
        return this;
    }

    use(app: AppType): Api {
        this.apps.push(app);
        return this;
    }

    async install() {
        await this.init();
        // Let's process all hooks, attached by all used apps. Descriptions of hooks in the following lines.

        // Used for configuring, eg. entity layer, services, graphql or some other internal config parameter.
        await this.__processHooks("configure");

        // Executed if installation process is running. Will be automatically started on first run.
        this.log("Starting the installation process...", "info");
        await this.__processHooks("preInstall");
        await this.__processHooks("install");
        await this.__processHooks("postInstall");

        this.log("Installation complete!", "success");
        process.exit(0);
    }

    async prepare(options: Object = {}): Promise<Function> {
        if (this.handler) {
            return this.handler;
        }

        await this.init();

        // Used for configuring, eg. entity layer, services, graphql or some other internal config parameter.
        await this.__processHooks("configure");

        // Once everything was configured and optionally installed, initialization of each app starts.
        await this.__processHooks("preInit");
        await this.__processHooks("init");
        await this.__processHooks("postInit");

        this.namespace = cls.createNamespace(Date.now().toString());

        // Build event handler
        const handler = createHandler(this.namespace, options);
        this.handler = async args => {
            this.__processHooks("preHandle");
            const output = await handler(args);
            this.__processHooks("postHandle");
            return output;
        };

        return this.handler;
    }

    /**
     * Used for development purposes, to highlight more important messages to the user.
     * @param message
     * @param type
     */
    log(message: string, type: ?string) {
        // eslint-ignore-next-line
        switch (type) {
            case "success":
                // eslint-disable-next-line
                return console.log(chalk.green(message));
            case "info":
                // eslint-disable-next-line
                return console.log(chalk.blue(message));
            case "warning":
                // eslint-disable-next-line
                return console.log(chalk.yellow(message));
            case "error":
                // eslint-disable-next-line
                return console.log(chalk.red(message));
            default:
                // eslint-disable-next-line
                console.log(message);
        }
    }

    async init() {
        const { default: coreApp } = await import("./coreApp");
        this.apps.unshift(coreApp());

        if (Object.keys(this.config).length === 0) {
            this.log(
                `Configuration missing, did you forget to call "api.configuration({...})"?`,
                "error"
            );
            process.exit(1);
        }
    }

    /**
     * Processes "configure", "install" and "init" hooks, attached from used apps.
     * If something goes wrong, process will be terminated, with error message outputted.
     * @param hook
     * @returns {Promise<void>}
     * @private
     */
    async __processHooks(hook: string) {
        const hooks = [];
        this.apps.forEach(app => {
            if (typeof app[hook] === "function") {
                hooks.push(app[hook]);
            }
        });

        if (this.config.hooks && this.config.hooks[hook]) {
            hooks.push(this.config.hooks[hook]);
        }

        const params: Object = { api: this };

        if (hook === "init") {
            params.schema = schema;
        }

        try {
            await compose(hooks)(params);
        } catch (e) {
            this.log(`An error occurred in the "${hook}" process:\n${e.stack}`, "error");
            process.exit(1);
        }
    }
}

export default Api;
