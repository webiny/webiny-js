const {EntityAttributesContainer} = require('webiny-entity');
const attributes = require('./attributes');

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class MySQLAttributesContainer extends EntityAttributesContainer {
    boolean() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.boolean(this.name, this));
        return model.getAttribute(this.name);
    }

    date() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new attributes.date(this.name, this));
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

	entities(entity, attribute = null) {
		const parent = this.getParentModel();
		parent.setAttribute(this.name, new attributes.entities(this.name, this, entity, attribute));
		return parent.getAttribute(this.name);

	}
}

module.exports = MySQLAttributesContainer;