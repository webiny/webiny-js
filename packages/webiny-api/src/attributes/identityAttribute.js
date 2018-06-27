// @flow
import { EntityAttribute, type Entity, type EntityAttributesContainer } from "webiny-entity";
import type SecurityService from "../services/securityService";
import type { EntityAttributeOptions } from "webiny-entity/types";

export default class IdentityAttribute extends EntityAttribute {
    constructor(
        name: string,
        attributesContainer: EntityAttributesContainer,
        security: SecurityService,
        options: EntityAttributeOptions
    ) {
        super(
            name,
            ((attributesContainer: any): EntityAttributesContainer),
            ((security.getIdentityClasses(): any): Class<Entity>),
            options
        );
    }
}
