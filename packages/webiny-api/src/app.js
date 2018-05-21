// @flow
import debug from "debug";
import cls from "cls-hooked";
import compose from "webiny-compose";
import { ServiceManager } from "webiny-service-manager";
import GraphQL from "./graphql/GraphQL";
import EntityManager from "./entities/EntityManager";
import { Entity, File, Image, Group, Entities2Groups, SecuritySettings, User } from "./index";
import type Schema from "./graphql/Schema";
import createMiddleware from "./graphql/middleware.js";
import { SecurityService } from "./services";
import { GraphQLUnionType } from "graphql";
import createLoginQueries from "./security/graphql/createLoginQueries";
import createListEntitiesQueries from "./security/graphql/createListEntitiesQueries";

// Attributes registration functions
import convertToGraphQL from "./attributes/convertToGraphQL";
import registerBufferAttribute from "./attributes/registerBufferAttribute";
import registerPasswordAttribute from "./attributes/registerPasswordAttribute";
import registerIdentityAttribute from "./attributes/registerIdentityAttribute";
import registerFileAttributes from "./attributes/registerFileAttributes";
import registerImageAttributes from "./attributes/registerImageAttributes";

import { argv } from "yargs";

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

        this.entities.addEntityClass(File);
        this.entities.addEntityClass(Image);
        this.entities.addEntityClass(Group);
        this.entities.addEntityClass(Entities2Groups);
        this.entities.addEntityClass(User);
        this.entities.addEntityClass(SecuritySettings);
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
                    passwordAttribute: registerPasswordAttribute,
                    identityAttribute: registerIdentityAttribute,
                    fileAttributes: registerFileAttributes,
                    imageAttributes: registerImageAttributes
                });
        }
    }

    async init() {
        this.services.register("security", () => {
            return new SecurityService(this.config.security);
        });

        if (argv.install) {
            const { default: install } = await import("./install");
            await install();
        }

        await this.services.get("security").init();

        this.graphql.schema((schema: Schema) => {
            schema.addAttributeConverter(convertToGraphQL);
            schema.addEntity(File);
            schema.addEntity(Image);
            schema.addEntity(Group);
            schema.addEntity(Entities2Groups);
            schema.addEntity(User);
            schema.addEntity(SecuritySettings);

            schema.addType({
                meta: {
                    type: "union"
                },
                type: new GraphQLUnionType({
                    name: "IdentityType",
                    types: () =>
                        this.config.security.identities.map(({ identity: Identity }) => {
                            return schema.getType(Identity.classId);
                        }),
                    resolveType(identity) {
                        return schema.getType(identity.classId);
                    }
                })
            });

            schema.addAttributeConverter(convertToGraphQL);

            // Create login queries
            createLoginQueries(this, this.config, schema);
            createListEntitiesQueries(this, this.config, schema);
        });
    }

    use(app: Function) {
        this.apps.push(app);
    }

    middleware(middleware: Function<Array<Function>>, options: Object = {}): Function {
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
