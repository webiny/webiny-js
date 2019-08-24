// @flow
import type { Model } from ".";
import AttributesContainer from "./attributesContainer";
import {
    ArrayAttribute,
    CharAttribute,
    BooleanAttribute,
    IntegerAttribute,
    FloatAttribute,
    DateAttribute,
    ModelAttribute,
    ModelsAttribute,
    ObjectAttribute
} from "./attributes";

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class DefaultAttributesContainer extends AttributesContainer {
    attr(attribute: string): DefaultAttributesContainer {
        super.attr(attribute);
        return this;
    }

    array(): ArrayAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new ArrayAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): ArrayAttribute);
    }

    char(): CharAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new CharAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): CharAttribute);
    }

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

    integer(): IntegerAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new IntegerAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): IntegerAttribute);
    }

    float(): FloatAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new FloatAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): FloatAttribute);
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

    object(): ObjectAttribute {
        const model = this.getParentModel();
        model.setAttribute(this.name, new ObjectAttribute(this.name, this));
        return ((model.getAttribute(this.name): any): ObjectAttribute);
    }
}

export default DefaultAttributesContainer;
