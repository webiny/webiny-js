// @flow
import { User, Role, Permission, RoleGroup } from "./index";
import AuthenticationService from "./services/authentication";
import AuthorizationService from "./services/authorization";
import registerAttributes from "./attributes/registerAttributes";
import createLoginQueries from "./utils/createLoginQueries";
import attachAuthorization from "./utils/attachAuthorization";

export default (config: Object = {}) => {
    return ({ app }: Object, next: Function) => {
        app.services.register(
            "authentication",
            () => new AuthenticationService(config.authentication)
        );
        app.services.register("authorization", () => new AuthorizationService());
        registerAttributes(app.services.get("authentication"));

        app.graphql.schema(schema => {
            schema.crud(User);
            schema.crud(Role);
            schema.crud(RoleGroup);
            schema.crud(Permission);

            // Create login queries
            createLoginQueries(app, config, schema);
        });

        attachAuthorization(app);

        // Helper attributes
        /*this.extendEntity("*", (entity: Entity) => {
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
        });*/

        next();
    };
};
