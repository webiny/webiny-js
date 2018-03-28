"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _attribute = require("./../attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _index = require("../index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class DynamicAttribute extends _attribute2.default {
    constructor(name, attributesContainer, callback) {
        super(name, attributesContainer);
        this.callback = callback;
        this.toStorage = false;
    }

    canSetValue() {
        return false;
    }

    // eslint-disable-next-line
    getValue() {
        const current = this.callback.call(this.getParentModel(), ...arguments);
        return this.onGetCallback(current, ...arguments);
    }
}

exports.default = DynamicAttribute;
//# sourceMappingURL=dynamicAttribute.js.map
