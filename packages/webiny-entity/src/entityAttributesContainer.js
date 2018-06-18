// @flow
import { DefaultAttributesContainer } from "webiny-model";
import type { Model } from "webiny-model";

import {
    EntityAttribute,
    EntitiesAttribute,
    ModelAttribute,
    ModelsAttribute
} from "./entityAttributes";

import type Entity from "./entity";
import type { EntityAttributeOptions } from "../types";

class EntityAttributesContainer extends DefaultAttributesContainer {
    entity(
        entity: Class<Entity> | Array<Class<Entity>>,
        options: EntityAttributeOptions = {}
    ): EntityAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntityAttribute(this.name, this, entity, options));
        return parent.getAttribute(this.name);
    }

    entities(entity: Class<Entity>, attribute: ?string = null): EntitiesAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntitiesAttribute(this.name, this, entity, attribute));
        return parent.getAttribute(this.name);
    }

    model(model: Class<Model>): ModelAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    models(model: Class<Model>): ModelsAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelsAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }
}

export default EntityAttributesContainer;
