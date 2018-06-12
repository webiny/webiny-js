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

declare type AppType = {
    preInit?: Function,
    init: Function,
    postInit?: Function,
    install?: Function,
    preInstall?: Function,
    postInstall?: Function
};

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
        // "pre" and "post" lifecycle events were added additionally, after the same was done in
        // the "install" process. Read the comment below to get a better understanding.
        const init = { pre: [], main: [], post: [] };

        this.apps.map(app => {
            if (typeof app.preInit === "function") {
                init.pre.push(app.preInit);
            }

            if (typeof app.init === "function") {
                init.main.push(app.init);
            }

            if (typeof app.postInit === "function") {
                init.post.push(app.postInit);
            }
        });

        await compose(init.pre)({ api: this });
        await compose(init.main)({ api: this });
        await compose(init.post)({ api: this });

        // Optionally run install process for each registered app.
        if (process.env.INSTALL === "true") {
            // Installation happens in three stages - "pre", "main" and "post" stage.
            // "pre" - will be executed first, before main chain.
            // "main" - will be executed after all install processes are finished in the pre stage
            // "post" - will be executed after all install processes are finished in the main stage
            //
            // Good example of usage is initialization of security service. After main stage is done, core app will
            // initialize security service in the "post" step.
            const install = { pre: [], main: [], post: [] };

            this.apps.map(app => {
                if (typeof app.preInstall === "function") {
                    install.pre.push(app.preInstall);
                }

                if (typeof app.install === "function") {
                    install.main.push(app.install);
                }

                if (typeof app.postInstall === "function") {
                    install.post.push(app.postInstall);
                }
            });

            await compose(install.pre)({ api: this });
            await compose(install.main)({ api: this });
            await compose(install.post)({ api: this });

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
