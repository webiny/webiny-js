// @flow
import type { Model } from "webiny-model";
import type {
    ModelAttribute as BaseModelAttribute,
    ModelsAttribute as BaseModelsAttribute
} from "webiny-entity";

import { EntityAttributesContainer } from "webiny-entity";
import {
    ArrayAttribute,
    BooleanAttribute,
    DateAttribute,
    ModelAttribute,
    ModelsAttribute,
    ObjectAttribute
} from "./attributes";

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class MySQLAttributesContainer extends EntityAttributesContainer {
    boolean(): BooleanAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new BooleanAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): BooleanAttribute);
    }

    date(): DateAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new DateAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): DateAttribute);
    }

    array(): ArrayAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new ArrayAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): ArrayAttribute);
    }

    object(): ObjectAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new ObjectAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): ObjectAttribute);
    }

    model(model: Class<Model>): BaseModelAttribute & ModelAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelAttribute(this.name, this, model));
        return ((parent.getAttribute(this.name): any): BaseModelAttribute & ModelAttribute);
    }

    models(model: Class<Model>): BaseModelsAttribute & ModelsAttribute {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new ModelsAttribute(this.name, this, model));
        return ((parent.getAttribute(this.name): any): BaseModelsAttribute & ModelsAttribute);
    }
}

export default MySQLAttributesContainer;
