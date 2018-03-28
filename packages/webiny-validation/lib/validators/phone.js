"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = value => {
    if (!value) return;
    value = value + "";

    if (value.match(/^[-+0-9()/\s]+$/)) {
        return;
    }
    throw new _validationError2.default("Value must be a valid phone number.");
};
//# sourceMappingURL=phone.js.map
