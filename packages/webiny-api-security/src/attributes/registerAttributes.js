import { EntityAttributesContainer } from "webiny-entity";

import type { IAuthentication } from "../../types";
import PasswordAttribute from "./passwordAttribute";
import IdentityAttribute from "./identityAttribute";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default (authentication: IAuthentication) => {
    /**
     * Password attribute
     * @package webiny-api-security
     * @return {PasswordAttribute}
     */
    EntityAttributesContainer.prototype.password = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new PasswordAttribute(this.name, this));
        return parent.getAttribute(this.name);
    };

    /**
     * Identity attribute. Used to store a reference to an Identity.
     * @package webiny-api-security
     * @return {IdentityAttribute}
     */
    EntityAttributesContainer.prototype.identity = function(options: EntityAttributeOptions) {
        const model = this.getParentModel();
        model.setAttribute(
            this.name,
            new IdentityAttribute(this.name, this, authentication, options)
        );
        return model.getAttribute(this.name);
    };
};
