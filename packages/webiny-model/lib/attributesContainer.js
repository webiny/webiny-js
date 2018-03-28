"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Base AttributesContainer class, can be extended to implement new types of model attributes.
 */
class AttributesContainer {
    constructor(model) {
        /**
         * Parent parentModel - instance of Model class.
         */
        this.parentModel = model;

        /**
         * Name of current attribute
         */
        this.name = "";
    }

    attr(attribute) {
        this.name = attribute;
        return this;
    }

    getParentModel() {
        return this.parentModel;
    }

    custom(attribute) {
        const model = this.getParentModel();
        const args = (0, _from2.default)(arguments);
        args.shift();
        model.setAttribute(this.name, new attribute(this.name, this, ...args));
        return model.getAttribute(this.name);
    }
}
exports.default = AttributesContainer;
//# sourceMappingURL=attributesContainer.js.map
