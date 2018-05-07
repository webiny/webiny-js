// @flow
import { GraphQLUnionType } from "graphql";
import { User, Role } from "./index";
import AuthenticationService from "./services/authentication";
import AuthorizationService from "./services/authorization";
import convertToGraphQL from "./attributes/convertToGraphQL";
import registerAttributes from "./attributes/registerAttributes";
import createLoginQueries from "./utils/createLoginQueries";
import createListEntitiesQueries from "./utils/createListEntitiesQueries";
import attachAuthorization from "./utils/attachAuthorization";
import { Entity } from "webiny-api";

export default (config: Object = {}) => {
    return ({ app }: Object, next: Function) => {
        app.services.register(
            "authentication",
            () => new AuthenticationService(config.authentication)
        );
        app.services.register("authorization", () => new AuthorizationService());
        registerAttributes(app.services.get("authentication"));

        app.graphql.schema(schema => {
            schema.addType({
                meta: {
                    type: "union"
                },
                type: new GraphQLUnionType({
                    name: "IdentityType",
                    types: () =>
                        config.authentication.identities.map(({ identity: Identity }) => {
                            return schema.getType(Identity.classId);
                        }),
                    resolveType(identity) {
                        return schema.getType(identity.classId);
                    }
                })
            });

            schema.addAttributeConverter(convertToGraphQL);
            schema.addEntity(User);
            schema.addEntity(Role);

            // Create login queries
            createLoginQueries(app, config, schema);
            createListEntitiesQueries(app, config, schema);
        });

        attachAuthorization(app);

        Entity.onGet((entity, key) => {
            const attr: ?Attribute = entity.getModel().getAttribute(key);
            if (attr) {
                // TODO: check security
            }
        });

        Entity.onSet((entity, key) => {
            const attr: ?Attribute = entity.getModel().getAttribute(key);
            if (attr) {
                // TODO: check security
            }
        });

        app.entities.addEntityClass(User);
        app.entities.addEntityClass(Role);

        app.entities.extend("*", (entity: Entity) => {
            // "savedBy" attribute - updated on both create and update events.
            entity.attr("savedByClassId").char();
            entity.attr("savedBy").identity({ classIdAttribute: "savedByClassId" });

            // "createdBy" attribute - updated only on entity creation.
            entity.attr("createdByClassId").char();
            entity.attr("createdBy").identity({ classIdAttribute: "createdByClassId" });

            // "updatedBy" attribute - updated only on entity updates.
            entity.attr("updatedByClassId").char();
            entity.attr("updatedBy").identity({ classIdAttribute: "updatedByClassId" });

            // We don't need a standalone "deletedBy" attribute, since its value would be the same as in "savedBy"
            // and "updatedBy" attributes. Check these attributes to find out who deleted an entity.
            entity.on("save", () => {
                if (!app.getRequest()) {
                    return;
                }

                const { identity } = app.getRequest();
                entity.savedBy = identity;
                if (entity.isExisting()) {
                    entity.updatedBy = identity;
                } else {
                    entity.createdBy = identity;
                }
            });
        });

        next();
    };
};
