"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _attributesContainer = require("./attributesContainer");

var _attributesContainer2 = _interopRequireDefault(_attributesContainer);

var _attributes = require("./attributes");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Contains basic attributes. If needed, this class can be extended to add additional attributes,
 * and then be set as a new attributes container as the default one.
 */
class DefaultAttributesContainer extends _attributesContainer2.default {
    attr(attribute) {
        super.attr(attribute);
        return this;
    }

    array() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.ArrayAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    char() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.CharAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    boolean() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.BooleanAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    integer() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.IntegerAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    float() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.FloatAttribute(this.name, this));
        return model.getAttribute(this.name);
    }

    dynamic(callback) {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.DynamicAttribute(this.name, this, callback));
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

    date() {
        const model = this.getParentModel();
        model.setAttribute(this.name, new _attributes.DateAttribute(this.name, this));
        return model.getAttribute(this.name);
    }
}
exports.default = DefaultAttributesContainer;
//# sourceMappingURL=defaultAttributesContainer.js.map
