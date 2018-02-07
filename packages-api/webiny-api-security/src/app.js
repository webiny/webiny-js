import { services, App } from "webiny-api";
import { EntityAttributesContainer } from "webiny-entity";
import BaseAuthEndpoint from "./endpoints/auth";
import generateEndpoint from "./endpoints/generator";
import AuthenticationService from "./services/authentication";
import passwordAttr from "./attributes/passwordAttribute";
import IdentityAttribute from "./attributes/identityAttribute";

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

        /**
         * Identity attribute. Used to store a reference to an Identity.
         * @package webiny-api-security
         * @return {IdentityAttribute}
         */
        EntityAttributesContainer.prototype.identity = function() {
            const model = this.getParentModel();
            model.setAttribute(this.name, new IdentityAttribute(this.name, this));
            return model.getAttribute(this.name);
        };

        // Helper attributes
        /*this.extendEntity("*", (entity: Entity) => {
            entity.attr("createdBy").identity();
            entity.attr("updatedBy").identity();
            entity.attr("deletedBy").identity();
        });*/
    }
}

export default Security;
