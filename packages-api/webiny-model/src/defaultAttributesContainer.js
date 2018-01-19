import AttributesContainer from './attributesContainer'
import attributes from './attributes'

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class DefaultAttributesContainer extends AttributesContainer {
    char() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.char(this.name, this));
        return model.getAttribute(this.name);
    }

    boolean() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.boolean(this.name, this));
        return model.getAttribute(this.name);
    }

    integer() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.integer(this.name, this));
        return model.getAttribute(this.name);
    }

    float() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.float(this.name, this));
        return model.getAttribute(this.name);
    }

    dynamic(callback) {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.dynamic(this.name, this, callback));
        return model.getAttribute(this.name);
    }

    model(model) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new attributes.model(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    models(model) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new attributes.models(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    date() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.date(this.name, this));
        return model.getAttribute(this.name);
    }
}

export default DefaultAttributesContainer;