import {DefaultAttributesContainer} from 'webiny-model'
import attributes from './entityAttributes'

class EntityAttributesContainer extends DefaultAttributesContainer {
    entity(entity) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new attributes.entity(this.name, this, entity));
        return parent.getAttribute(this.name);
    }

    entities(entity, attribute = null) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new attributes.entities(this.name, this, entity, attribute));
        return parent.getAttribute(this.name);

    }
}

export default EntityAttributesContainer;