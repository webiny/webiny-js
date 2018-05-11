// @flow
import { GraphQLUnionType } from "graphql";
import { User, Group, SecuritySettings } from "./index";
import AuthenticationService from "./services/security";
import convertToGraphQL from "./attributes/convertToGraphQL";
import registerAttributes from "./attributes/registerAttributes";
import createLoginQueries from "./utils/createLoginQueries";
import createListEntitiesQueries from "./utils/createListEntitiesQueries";
import { Entity } from "webiny-api";

export default (config: Object = {}) => {
    return ({ app }: Object, next: Function) => {
        app.services.register(
            "authentication",
            () => new AuthenticationService(config.authentication)
        );
        registerAttributes(app.services.get("authentication"));

        const security = app.services.get("authentication");

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
            schema.addEntity(Group);

            // Create login queries
            createLoginQueries(app, config, schema);
            createListEntitiesQueries(app, config, schema);
        });

        app.entities.addEntityClass(User);
        app.entities.addEntityClass(Group);
        app.entities.addEntityClass(SecuritySettings);

        Entity.onGet(({ attribute, entity }) => {
            const { identity } = app.getRequest();
            if (!security.canGetValue(identity, attribute)) {
                throw Error(
                    `Cannot get value of attribute "${attribute.name}" on entity "${
                        entity.classId
                    }"`
                );
            }
        });

        ["create", "update", "delete", "read"].forEach(operation => {
            Entity.on(operation, ({ entity }) => {
                const { identity } = app.getRequest();

                if (!security.canExecuteOperation(identity, entity, operation)) {
                    throw Error(
                        `Cannot execute "${operation}" operation on entity "${entity.classId}"`
                    );
                }

                if (operation === "create") {
                    if (identity) {
                        security.assignOwner(entity, identity);
                    }
                }
            });
        });

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
