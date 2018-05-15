// @flow
import { GraphQLUnionType } from "graphql";
import { User, SecuritySettings } from "./index";
import AuthenticationService from "./services/security";
import convertToGraphQL from "./attributes/convertToGraphQL";
import registerAttributes from "./attributes/registerAttributes";
import createLoginQueries from "./utils/createLoginQueries";
import createListEntitiesQueries from "./utils/createListEntitiesQueries";
import { Entity } from "webiny-api";

export default (config: Object = {}) => {
    return async ({ app }: Object, next: Function) => {
        app.services.register(
            "authentication",
            () => new AuthenticationService(config.authentication)
        );
        registerAttributes(app.services.get("authentication"));

        app.services.get("authentication").init();

        app.entities.addEntityClass(User);
        app.entities.addEntityClass(SecuritySettings);

        app.entities.extend("*", (entity: Entity) => {
            // "savedBy" attribute - updated on both create and update events.
            entity
                .attr("savedByClassId")
                .char()
                .setProtected();
            entity
                .attr("savedBy")
                .identity({ classIdAttribute: "savedByClassId" })
                .setProtected();

            // "createdBy" attribute - updated only on entity creation.
            entity
                .attr("createdByClassId")
                .char()
                .setProtected();
            entity
                .attr("createdBy")
                .identity({ classIdAttribute: "createdByClassId" })
                .setProtected();

            // "updatedBy" attribute - updated only on entity updates.
            entity
                .attr("updatedByClassId")
                .char()
                .setProtected();
            entity
                .attr("updatedBy")
                .identity({ classIdAttribute: "updatedByClassId" })
                .setProtected();

            // We don't need a standalone "deletedBy" attribute, since its value would be the same as in "savedBy"
            // and "updatedBy" attributes. Check these attributes to find out who deleted an entity.
            entity.on("save", async () => {
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

            // Create login queries
            createLoginQueries(app, config, schema);
            createListEntitiesQueries(app, config, schema);
        });

        next();
    };
};
