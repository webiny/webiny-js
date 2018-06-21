// @flow
import { EntityAttribute, type Entity, type EntityAttributesContainer } from "webiny-entity";
import type { IAuthentication } from "../../types";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default class IdentityAttribute extends EntityAttribute {
    constructor(
        name: string,
        attributesContainer: EntityAttributesContainer,
        authentication: IAuthentication,
        options: EntityAttributeOptions
    ) {
        super(
            name,
            ((attributesContainer: any): EntityAttributesContainer),
            ((authentication.getIdentityClasses(): any): Class<Entity>),
            options
        );
    }
}
