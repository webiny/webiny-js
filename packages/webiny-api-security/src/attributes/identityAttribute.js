// @flow
import { EntityAttribute } from "webiny-entity";
import { AttributesContainer } from "webiny-model";
import type { IAuthentication } from "../../types";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default (authentication: IAuthentication) => {
    return class IdentityAttribute extends EntityAttribute {
        constructor(
            name: string,
            attributesContainer: AttributesContainer,
            options: EntityAttributeOptions
        ) {
            super(name, attributesContainer, authentication.getIdentityClasses(), options);
        }
    };
};
