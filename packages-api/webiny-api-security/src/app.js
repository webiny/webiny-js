// @flow
import api, { App } from "webiny-api";
import BaseAuthEndpoint from "./endpoints/auth";
import generateEndpoint from "./endpoints/generator";
import { AuthenticationService, AuthorizationService } from "./index";
import registerAttributes from "./attributes/registerAttributes";
import UsersEndpoint from "./endpoints/users";
import PermissionsEndpoint from "./endpoints/permissions";
import RolesEndpoint from "./endpoints/roles";
import RoleGroupsEndpoint from "./endpoints/roleGroups";

class Security extends App {
    constructor(config: Object) {
        super();

        this.name = "Security";
        api.serviceManager.add(
            "Authentication",
            () => new AuthenticationService(config.authentication)
        );
        api.serviceManager.add("Authorization", () => new AuthorizationService());

        this.endpoints = [
            generateEndpoint(
                BaseAuthEndpoint,
                config.authentication,
                api.serviceManager.get("Authentication")
            ),
            UsersEndpoint,
            PermissionsEndpoint,
            RoleGroupsEndpoint,
            RolesEndpoint
        ];

        registerAttributes(api.serviceManager.get("Authentication"));

        // Helper attributes
        /*this.extendEntity("*", (entity: Entity) => {
            entity.attr("createdBy").identity();
            entity.attr("updatedBy").identity();
            entity.attr("deletedBy").identity();
        });*/
    }
}

export default Security;
