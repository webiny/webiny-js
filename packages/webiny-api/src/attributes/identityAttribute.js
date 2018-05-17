// @flow
import { EntityAttribute } from "webiny-entity";
import { AttributesContainer } from "webiny-model";
import type { IAuthentication } from "../../types";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default class IdentityAttribute extends EntityAttribute {
    constructor(
        name: string,
        attributesContainer: AttributesContainer,
        authentication: IAuthentication,
        options: EntityAttributeOptions
    ) {
        super(name, attributesContainer, authentication.getIdentityClasses(), options);
    }
}
