import { EntityModel, EntityAttributesContainer } from "webiny-entity";
import { ModelAttribute } from "webiny-model";

export default config => {
    class UserModel extends EntityModel {
        constructor() {
            super();
            this.attr("userId").char();
            this.attr("classId").char();
        }
    }

    class UserAttribute extends ModelAttribute {
        async getValue() {
            const value = ModelAttribute.prototype.getValue.call(this);
            const { identities } = config.authentication;
            const modelValue = this.value.getCurrent();
            for (let i = 0; i < identities.length; i++) {
                const identityClass = identities[i];
                if (identityClass.classId === modelValue.classId) {
                    return identityClass.findById(modelValue.userId);
                }
            }
            return value;
        }
    }

    /**
     * User attribute. Used to store a reference to an Identity.
     * @package webiny-api-security
     * @return {UserAttribute}
     */
    EntityAttributesContainer.prototype.user = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new UserAttribute(this.name, this, UserModel));
        return parent.getAttribute(this.name);
    };
};
