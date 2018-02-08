// @flow
import { DefaultAttributesContainer } from "webiny-model";
import {
    EntityAttribute,
    EntitiesAttribute,
    ModelAttribute,
    ModelsAttribute
} from "./entityAttributes";

import type Entity from "./entity";
import type { IModel } from "webiny-model/flow-typed";

class EntityAttributesContainer extends DefaultAttributesContainer {
    entity(entity: Class<Entity>): EntityAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new EntityAttribute(this.name, this, entity));
        return parent.getAttribute(this.name);
    }

    entities(entity: Class<Entity>, attribute: ?string = null, id: ?Function): EntitiesAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new EntitiesAttribute(this.name, this, entity, attribute, id)
        );
        return parent.getAttribute(this.name);
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
}

export default EntityAttributesContainer;
