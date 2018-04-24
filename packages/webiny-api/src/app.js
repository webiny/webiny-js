// @flow
import debug from "debug";
import cls from "cls-hooked";
import { execute } from "graphql";
import compose from "webiny-compose";
import { app as webiny } from "webiny-api";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import { Entity, File, Image } from "./index";
import getGraphQLParams from "./graphql/utils/getGraphQLParams";

import type Schema from "./graphql/Schema";

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

    getRequest(): express$Request {
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

    middleware(middleware: Function): Function {
        // Setup registered Webiny apps.
        compose(this.apps)({ app: this });

        const graphqlMiddleware = () => {
            return async (params, next) => {
                params.output = await execute(
                    webiny.graphql.getSchema(),
                    params.graphql.query,
                    null,
                    params.req,
                    params.graphql.variables,
                    params.graphql.operationName
                );

                next();
            };
        };

        middleware = middleware(graphqlMiddleware);

        middleware.unshift(async (params, next) => {
            params.graphql = await getGraphQLParams(params.req);
            next();
        });

        middleware.push((params, next, finish) => {
            if (!params.res.finished) {
                params.res.json(params.output);
            }
            finish();
        });

        const log = debug("webiny-api");
        this.namespace = cls.createNamespace(Date.now().toString());

        // Build request middleware.
        const webinyMiddleware = compose(middleware);

        // Route request.
        return async (req: express$Request, res: express$Response) => {
            log("Received new request");

            this.namespace.run(async () => {
                return (async () => {
                    this.namespace.set("req", req);
                    webinyMiddleware({ req, res });
                })();
            });
        };
    }
}

export default Api;
