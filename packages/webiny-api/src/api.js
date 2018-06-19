// @flow
import debug from "debug";
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import type { $Request, $Response } from "express";
import type { AppType, ApiRequest } from "./../types";
import createMiddleware from "./graphql/middleware.js";
import coreApp from "./coreApp";
import chalk from "chalk";

import { argv } from "yargs";
process.env.INSTALL = JSON.stringify(argv.install || false);

class Api {
    config: Object;
    graphql: GraphQL;
    services: ServiceManager;
    entities: EntityManager;
    namespace: cls$Namespace;
    apps: Array<AppType>;

    constructor() {
        this.config = {};
        this.graphql = new GraphQL();
        this.services = new ServiceManager();
        this.entities = new EntityManager();
        this.apps = [coreApp()];
    }

    getRequest(): ?ApiRequest {
        if (!this.namespace) {
            return null;
        }
        return this.namespace.get("req");
    }

    configure(config: Object) {
        this.config = config;
    }

    use(app: AppType) {
        this.apps.push(app);
    }

    async middleware(
        middleware: Function => Array<Function>,
        options: Object = {}
    ): Promise<Function> {
        // Let's process all hooks, attached by all used apps. Descriptions of hooks in the following lines.
        try {
            // Used for configuring, eg. entity layer, services, graphql or some other internal config parameter.
            await this.processHooks("configure");

            if (process.env.INSTALL === "true") {
                // Executed if installation process is running. Will be automatically started on first run.
                this.log("Starting the installation process...", "info");
                await this.processHooks("preInstall");
                await this.processHooks("install");
                await this.processHooks("postInstall");

                process.env.INSTALL = "false";
                this.log("Installation complete!", "success");
            }

            // Once everything was configured and optionally installed, initialization of each app starts.
            await this.processHooks("preInit");
            await this.processHooks("init");
            await this.processHooks("postInit");
        } catch (e) {
            this.log(`An error occurred in the "${e.hook}" process:\n${e.message}`, "error");
            process.exit();
        }

        const log = debug("webiny-api");

        this.namespace = cls.createNamespace(Date.now().toString());

        // Build request middleware.
        const webinyMiddleware = createMiddleware(middleware);

        // Route request.
        return async (req: $Request, res: $Response) => {
            log("Received new request");

            this.namespace.run(async () => {
                return (async () => {
                    this.namespace.set("req", req);
                    webinyMiddleware({ req, res }).catch(error => {
                        // Execute `onUncaughtError` callback if configured
                        if (typeof options.onUncaughtError === "function") {
                            return options.onUncaughtError({ error, req, res });
                        }

                        if (error instanceof Error) {
                            log(`%s`, error.stack);
                        }

                        // If no custom error handler is provided - send error response.
                        res.statusCode = error.status || 500;
                        res.json({ errors: [{ name: error.name, message: error.message }] });
                    });
                })();
            });
        };
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
