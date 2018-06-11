// @flow
import type Schema from "./graphql/Schema";
import { SecurityService } from "./services";
import { GraphQLUnionType } from "graphql";
import createLoginQueries from "./security/graphql/createLoginQueries";
import createListEntitiesQuery from "./security/graphql/createListEntitiesQuery";
import overrideCreateApiTokenMutation from "./security/graphql/overrideCreateApiTokenMutation";
import convertToGraphQL from "./attributes/convertToGraphQL";
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

export default () => {
    return {
        async init(params: Object, next: Function) {
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

            await api.services.get("security").init();

            api.graphql.schema((schema: Schema) => {
                schema.addAttributeConverter(convertToGraphQL);
                schema.addEntity(ApiToken);
                schema.addEntity(File);
                schema.addEntity(Image);
                schema.addEntity(Group);
                schema.addEntity(Groups2Entities);
                schema.addEntity(Policy);
                schema.addEntity(Policies2Entities);
                schema.addEntity(User);

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

            api.entities.addEntityClass(ApiToken);
            api.entities.addEntityClass(File);
            api.entities.addEntityClass(Image);
            api.entities.addEntityClass(Group);
            api.entities.addEntityClass(Groups2Entities);
            api.entities.addEntityClass(Policy);
            api.entities.addEntityClass(Policies2Entities);
            api.entities.addEntityClass(User);

            next();
        },

        async install(params: Object, next: Function) {
            const { default: install } = await import("./install");
            await install();

            next();
        }
    };
};
