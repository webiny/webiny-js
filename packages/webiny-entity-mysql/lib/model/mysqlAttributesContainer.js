"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _attributes = require("./attributes");

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class MySQLAttributesContainer extends _webinyEntity.EntityAttributesContainer {
    boolean() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.BooleanAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    date() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.DateAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    model(model) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new _attributes.ModelAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    models(model) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new _attributes.ModelsAttribute(this.name, this, model));
        return parent.getAttribute(this.name);
    }

    entities(entity, attribute = null) {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _attributes.EntitiesAttribute(this.name, this, entity, attribute)
        );
        return parent.getAttribute(this.name);
    }
}

exports.default = MySQLAttributesContainer;
//# sourceMappingURL=mysqlAttributesContainer.js.map
