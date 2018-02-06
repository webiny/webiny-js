// @flow
import type { Entity } from "webiny-entity";
import { EntityAttributesContainer } from "webiny-entity";
import {
    BooleanAttribute,
    DateAttribute,
    ModelAttribute,
    ModelsAttribute,
    EntitiesAttribute
} from "./attributes";

import type { IModel } from "webiny-model/flow-typed";

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class MySQLAttributesContainer extends EntityAttributesContainer {
    boolean(): BooleanAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new BooleanAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    date(): DateAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new DateAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    model(model: IModel): ModelAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    models(model: IModel): ModelsAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelsAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    entities(entity: Class<Entity>, attribute: ?string = null) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntitiesAttribute(this.name, this, entity, attribute));
        return parent.getAttribute(this.name);
    }
}

export default MySQLAttributesContainer;
