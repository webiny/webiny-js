// @flow
import get from "lodash/get";
import { SecurityService } from "./services";
import { Entity } from "./entities";
import { schema } from "./graphql";
import createLoginQueries from "./security/graphql/createLoginQueries";
import createIdentityQuery from "./security/graphql/createIdentityQuery";
import createSecurityField from "./security/graphql/createSecurityField";

// Entities and GraphQL types
import { Group } from "./entities/Entity/Entity";
import { FileType } from "./entities/File/File.graphql";

// Attributes registration functions
import registerBufferAttribute from "./attributes/registerBufferAttribute";
import registerPasswordAttribute from "./attributes/registerPasswordAttribute";
import registerIdentityAttribute from "./attributes/registerIdentityAttribute";

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

                registerBufferAttribute();
                registerPasswordAttribute();
                registerIdentityAttribute();
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
         *
         * @param params
         * @param next
         * @returns {Promise<void>}
         */
        async init(params: Object, next: Function) {
            const { api } = params;

            const security = api.services.get("security");
            if (!security.initialized) {
                await security.init();
            }

            if (get(api.config, "graphql.defaultFields", true) !== false) {
                createSecurityField(schema);
                createIdentityQuery(api, api.config, schema);
                createLoginQueries(api, api.config, schema);
                schema.addType(FileType);
            }

            next();
        }
    };
};
