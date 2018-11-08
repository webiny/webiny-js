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
        entity: Class<$Subtype<Entity>> | Array<Class<$Subtype<Entity>>>,
        options: EntityAttributeOptions = {}
    ): EntityAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntityAttribute(this.name, this, entity, options));
        return ((parent.getAttribute(this.name): any): EntityAttribute);
    }

    entities(entity: Class<$Subtype<Entity>>, attribute: string = ""): EntitiesAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntitiesAttribute(this.name, this, entity, attribute));
        return ((parent.getAttribute(this.name): any): EntitiesAttribute);
    }

    model(model: Class<Model>): ModelAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelAttribute(this.name, this, model));
        return ((parent.getAttribute(this.name): any): ModelAttribute);
    }

    models(model: Class<Model>, keyValue: boolean = false): ModelsAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelsAttribute(this.name, this, model, keyValue));
        return ((parent.getAttribute(this.name): any): ModelsAttribute);
    }
}

export default EntityAttributesContainer;
