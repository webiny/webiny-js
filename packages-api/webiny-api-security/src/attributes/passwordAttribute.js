import bcrypt from "bcryptjs";
import { CharAttribute } from "webiny-model";
import { EntityAttributesContainer } from "webiny-entity";

export default () => {
    /**
     * Password attribute
     * @package webiny-api-security
     * @return {UserAttribute}
     */
    EntityAttributesContainer.prototype.password = function() {
        const parent = this.getParentModel();
        const passwordAttr = new CharAttribute(this.name, this);
        passwordAttr.onSet(value => {
            if (value) {
                return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
            }
            return this.password;
        });
        parent.setAttribute(this.name, passwordAttr);
        return parent.getAttribute(this.name);
    };
};
