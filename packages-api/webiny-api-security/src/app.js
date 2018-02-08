// @flow
import api, { App } from "webiny-api";
import BaseAuthEndpoint from "./endpoints/auth";
import generateEndpoint from "./endpoints/generator";
import { AuthenticationService, AuthorizationService } from "./index";
import registerAttributes from "./attributes/registerAttributes";

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
            )
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
