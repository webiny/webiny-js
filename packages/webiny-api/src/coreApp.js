// @flow
import type Schema from "./graphql/Schema";
import { SecurityService } from "./services";
import { GraphQLUnionType } from "graphql";
import createLoginQueries from "./security/graphql/createLoginQueries";
import createListEntitiesQuery from "./security/graphql/createListEntitiesQuery";
import overrideCreateApiTokenMutation from "./security/graphql/overrideCreateApiTokenMutation";
import convertToGraphQL from "./attributes/convertAttributeToGraphQLType";
import {
    ApiToken,
    Entity,
    File,
    Image,
    Group,
    Groups2Entities,
    Policy,
    Policies2Entities,
    User
} from "./index";

// Attributes registration functions
import registerBufferAttribute from "./attributes/registerBufferAttribute";
import registerPasswordAttribute from "./attributes/registerPasswordAttribute";
import registerIdentityAttribute from "./attributes/registerIdentityAttribute";
import registerFileAttributes from "./attributes/registerFileAttributes";
import registerImageAttributes from "./attributes/registerImageAttributes";

/**
 * This app will always be initialized first. That's why we are assigning configurations,
 * checking the database connection and project installation here.
 */
export default () => {
    return {
        /**
         * We configure and test the received params here.
         * @param params
         * @param next
         * @returns {Promise<*>}
         */
        async configure(params: Object, next: Function) {
            const { api } = params;

            // Configure Entity layer
            if (api.config.entity) {
                // Register Entity driver
                Entity.driver = api.config.entity.driver;

                // Register attributes
                api.config.entity.attributes &&
                    api.config.entity.attributes({
                        bufferAttribute: registerBufferAttribute,
                        passwordAttribute: registerPasswordAttribute,
                        identityAttribute: registerIdentityAttribute,
                        fileAttributes: registerFileAttributes,
                        imageAttributes: registerImageAttributes
                    });
            }

            api.services.register("security", () => {
                return new SecurityService(api.config.security);
            });

            // Check if connection is valid and if Settings table exists - this will tell us if the system is installed.
            if (process.env.NODE_ENV === "development") {
                try {
                    await Entity.getDriver().test();
                } catch (e) {
                    throw Error(
                        `The following error occurred while initializing Entity driver: "${
                            e.message
                        }". Did you enter the correct database information?`
                    );
                }

                if (process.env.INSTALL === "true") {
                    return next();
                }

                let defaultGroup = null;
                try {
                    defaultGroup = await Group.getDefaultGroup();
                } catch (e) {
                    // Do nothing, this is just in case the driver throws an error because of the missing table.
                } finally {
                    // If default group was not found, that means system is not installed, and we have to install
                    // it in the next steps.
                    if (!defaultGroup) {
                        process.env.INSTALL = "true";
                    }
                }
            }

            next();
        },

        /**
         * Will be executed if the install flag is set to true (prepares database).
         * @param params
         * @param next
         * @returns {Promise<void>}
         */
        async install(params: Object, next: Function) {
            const { default: install } = await import("./install");
            await install();
            next();
        },

        /**
         * After the installation (of all apps) has finished, let's enable security.
         * @param params
         * @param next
         * @returns {Promise<void>}
         */
        async postInstall(params: Object, next: Function) {
            const { api } = params;
            await api.services.get("security").init();
            next();
        },

        /**
         *
         * @param params
         * @param next
         * @returns {Promise<void>}
         */
        async init(params: Object, next: Function) {
            const { api } = params;

            // If we are in the install process, we don't need to initialize security just yet. Let's first allow
            // all apps to be installed, and then do the initialization in the "postInstall" lifecycle event.
            const security = api.services.get("security");
            if (!security.initialized) {
                await security.init();
            }

            api.graphql.schema((schema: Schema) => {
                schema.addAttributeConverter(convertToGraphQL);
                schema.registerEntity(ApiToken);
                schema.registerEntity(File);
                schema.registerEntity(Image);
                schema.registerEntity(Group);
                schema.registerEntity(Groups2Entities);
                schema.registerEntity(Policy);
                schema.registerEntity(Policies2Entities);
                schema.registerEntity(User);

                schema.addType({
                    meta: {
                        type: "union"
                    },
                    type: new GraphQLUnionType({
                        name: "IdentityType",
                        types: () =>
                            api.config.security.identities.map(({ identity: Identity }) => {
                                return schema.getType(Identity.classId);
                            }),
                        resolveType(identity) {
                            return schema.getType(identity.classId);
                        }
                    })
                });

                schema.addAttributeConverter(convertToGraphQL);

                // Create login queries

                createLoginQueries(api, api.config, schema);
                createListEntitiesQuery(api, api.config, schema);
                overrideCreateApiTokenMutation(api, api.config, schema);
            });

            api.entities.registerEntity(ApiToken);
            api.entities.registerEntity(File);
            api.entities.registerEntity(Image);
            api.entities.registerEntity(Group);
            api.entities.registerEntity(Groups2Entities);
            api.entities.registerEntity(Policy);
            api.entities.registerEntity(Policies2Entities);
            api.entities.registerEntity(User);

            next();
        }
    };
};
