// @flow
import debug from "debug";
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import type { $Request, $Response } from "express";
import createMiddleware from "./graphql/middleware.js";
import coreApp from "./core";

import { argv } from "yargs";
process.env.INSTALL = JSON.stringify(argv.install || false);

declare type AppType = { init: Function, install?: Function };

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

    getRequest(): ?$Request {
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
        // Initialize registered Webiny apps.
        await compose(this.apps.map(app => app.init))({ api: this });

        // Optionally run install for each registered app
        if (process.env.INSTALL === "true") {
            const installers = [];
            this.apps.map(app => {
                if (typeof app.install === "function") {
                    installers.push(app.install);
                }
            });

            await compose(installers)({ api: this });
            process.env.INSTALL = "false";
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
}

export default Api;
