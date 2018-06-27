// @flow
import { EntityAttributesContainer } from "webiny-entity";
import IdentityAttribute from "./identityAttribute";
import { api } from "webiny-api";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default () => {
    /**
     * Identity attribute. Used to store a reference to an Identity.
     * @return {IdentityAttribute}
     */
    // $FlowFixMe
    EntityAttributesContainer.prototype.identity = function(options: EntityAttributeOptions) {
        const model = this.getParentModel();
        model.setAttribute(
            this.name,
            new IdentityAttribute(this.name, this, api.services.get("security"), options)
        );
        return model.getAttribute(this.name);
    };
};
