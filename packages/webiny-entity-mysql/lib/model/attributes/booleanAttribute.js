"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyModel = require("webiny-model");

class BooleanAttribute extends _webinyModel.BooleanAttribute {
    /**
     * We must make sure a boolean value is sent, and not 0 or 1, which are stored in MySQL.
     * @param value
     */
    setStorageValue(value) {
        return this.setValue(!!value);
    }
}

exports.default = BooleanAttribute;
//# sourceMappingURL=booleanAttribute.js.map
