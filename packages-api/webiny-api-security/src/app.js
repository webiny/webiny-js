import type { Entity } from "webiny-api";
import { services, App } from "webiny-api";
import BaseAuthEndpoint from "./endpoints/auth";
import generateEndpoint from "./endpoints/generator";
import AuthenticationService from "./services/authentication";
import passwordAttr from "./attributes/password";
import userAttr from "./attributes/user";

class Security extends App {
    constructor(config) {
        super();

        this.name = "Security";
        services.add("Authentication", () => new AuthenticationService(config.authentication));

        this.endpoints = [
            generateEndpoint(
                BaseAuthEndpoint,
                config.authentication,
                services.get("Authentication")
            )
        ];

        passwordAttr(config);
        userAttr(config);

        this.extendEntity("*", (entity: Entity) => {
            entity.attr("createdBy").user();
            entity.attr("updatedBy").user();
            entity.attr("deletedBy").user();
        });
    }
}

export default Security;
