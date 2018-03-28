"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _webinyModel = require("webiny-model");

exports.default = authentication => {
    return class IdentityAttribute extends _webinyEntity.EntityAttribute {
        constructor(name, attributesContainer, options) {
            super(name, attributesContainer, authentication.getIdentityClasses(), options);
        }
    };
};
//# sourceMappingURL=identityAttribute.js.map
