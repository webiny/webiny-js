// @flow
import { EntityAttributesContainer } from "webiny-entity";
import PasswordAttribute from "./passwordAttribute";

export default () => {
    /**
     * Password attribute
     * @return {PasswordAttribute}
     */
    // $FlowFixMe
    EntityAttributesContainer.prototype.password = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new PasswordAttribute(this.name, this));
        return parent.getAttribute(this.name);
    };
};
