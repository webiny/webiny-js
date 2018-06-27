// @flow
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import createHandler from "./graphql/createHandler";
import coreApp from "./coreApp";
import chalk from "chalk";
import type { AppType, LambdaEvent } from "./../types";

import { argv } from "yargs";
process.env.INSTALL = JSON.stringify(argv.install || false);

class Api {
    handler: Function;
    config: ?Object;
    graphql: GraphQL;
    services: ServiceManager;
    entities: EntityManager;
    namespace: cls$Namespace;
    apps: Array<AppType>;

    constructor() {
        this.config = null;
        this.graphql = new GraphQL();
        this.services = new ServiceManager();
        this.entities = new EntityManager();
        this.apps = [coreApp()];
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
        if (!this.config) {
            this.log(
                `Configuration missing, did you forget to call "api.configuration({...})"?`,
                "error"
            );
            process.exit(1);
        }
        // Let's process all hooks, attached by all used apps. Descriptions of hooks in the following lines.
        try {
            // Used for configuring, eg. entity layer, services, graphql or some other internal config parameter.
            await this.processHooks("configure");

            // Executed if installation process is running. Will be automatically started on first run.
            this.log("Starting the installation process...", "info");
            await this.processHooks("preInstall");
            await this.processHooks("install");
            await this.processHooks("postInstall");

            this.log("Installation complete!", "success");
            process.exit(0);
        } catch (e) {
            this.log(`An error occurred in the "${e.hook}" process:\n${e.message}`, "error");
            process.exit(1);
        }
    }

    async prepare(options: Object = {}): Promise<Function> {
        if (this.handler) {
            return this.handler;
        }

        if (!this.config) {
            this.log(
                `Configuration missing, did you forget to call "api.configuration({...})"?`,
                "error"
            );
            process.exit(1);
        }

        // Let's process all hooks, attached by all used apps. Descriptions of hooks in the following lines.
        try {
            // Used for configuring, eg. entity layer, services, graphql or some other internal config parameter.
            await this.processHooks("configure");

            // Once everything was configured and optionally installed, initialization of each app starts.
            await this.processHooks("preInit");
            await this.processHooks("init");
            await this.processHooks("postInit");
        } catch (e) {
            this.log(`An error occurred in the "${e.hook}" process:\n${e.message}`, "error");
            process.exit(1);
        }

        this.namespace = cls.createNamespace(Date.now().toString());

        // Build event handler
        this.handler = createHandler(this.namespace, options);

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

    async processHooks(hook: string) {
        const hooks = [];
        this.apps.forEach(app => {
            if (typeof app[hook] === "function") {
                hooks.push(app[hook]);
            }
        });

        try {
            await compose(hooks)({ api: this });
        } catch (e) {
            e.hook = hook;
            throw e;
        }
    }
}

export default Api;
