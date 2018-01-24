// @flow
import { DefaultAttributesContainer } from "webiny-model";
import { EntityAttribute, EntitiesAttribute } from "./entityAttributes";

class EntityAttributesContainer extends DefaultAttributesContainer {
    entity(entity: Class<Entity>) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntityAttribute(this.name, this, entity));
        return parent.getAttribute(this.name);
    }

    entities(entity: Class<Entity>, attribute: ?string = null) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntitiesAttribute(this.name, this, entity, attribute));
        return parent.getAttribute(this.name);
    }
}

export default EntityAttributesContainer;
