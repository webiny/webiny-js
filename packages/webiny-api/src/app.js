// @flow
import debug from "debug";
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import { Entity, File, Image } from "./index";
import type Schema from "./graphql/Schema";
import createMiddleware from "./graphql/middleware";

// Attributes registration functions
import convertToGraphQL from "./attributes/convertToGraphQL";
import registerBufferAttribute from "./attributes/registerBufferAttribute";
import registerFileAttributes from "./attributes/registerFileAttributes";
import registerImageAttributes from "./attributes/registerImageAttributes";

class Api {
    config: Object;
    graphql: GraphQL;
    services: ServiceManager;
    entities: EntityManager;
    namespace: cls$Namespace;
    apps: Array<Function>;

    constructor() {
        this.config = {};
        this.graphql = new GraphQL();
        this.services = new ServiceManager();
        this.entities = new EntityManager();
        this.apps = [];

        this.graphql.schema((schema: Schema) => {
            schema.addAttributeConverter(convertToGraphQL);
            schema.addEntity(File);
            schema.addEntity(Image);
        });
    }

    getRequest(): ?express$Request {
        if (!this.namespace) {
            return null;
        }
        return this.namespace.get("req");
    }

    configure(config: Object) {
        this.config = config;

        // Configure Entity layer
        if (config.entity) {
            // Register Entity driver
            Entity.driver = config.entity.driver;
            // Register attributes
            config.entity.attributes &&
                config.entity.attributes({
                    bufferAttribute: registerBufferAttribute,
                    fileAttributes: registerFileAttributes,
                    imageAttributes: registerImageAttributes
                });
        }
    }

    use(app: Function) {
        this.apps.push(app);
    }

    middleware(middleware: Function, options: Object = {}): Function {
        // Setup registered Webiny apps.
        compose(this.apps)({ app: this });

        const log = debug("webiny-api");

        this.namespace = cls.createNamespace(Date.now().toString());

        // Build request middleware.
        const webinyMiddleware = createMiddleware(middleware);

        // Route request.
        return async (req: express$Request, res: express$Response) => {
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

                        // If no custom error handler is provided - send error response
                        res.statusCode = error.status || 500;
                        res.json({ errors: [error] });
                    });
                })();
            });
        };
    }
}

export default Api;
