"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyModel = require("webiny-model");

var _entityAttributes = require("./entityAttributes");

class EntityAttributesContainer extends _webinyModel.DefaultAttributesContainer {
    entity(entity, options = {}) {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _entityAttributes.EntityAttribute(this.name, this, entity, options)
        );
        return parent.getAttribute(this.name);
    }

    entities(entity, attribute = null) {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _entityAttributes.EntitiesAttribute(this.name, this, entity, attribute)
        );
        return parent.getAttribute(this.name);
    }

    model(model) {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _entityAttributes.ModelAttribute(this.name, this, model)
        );
        return parent.getAttribute(this.name);
    }

    models(model) {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _entityAttributes.ModelsAttribute(this.name, this, model)
        );
        return parent.getAttribute(this.name);
    }
}

exports.default = EntityAttributesContainer;
//# sourceMappingURL=entityAttributesContainer.js.map
