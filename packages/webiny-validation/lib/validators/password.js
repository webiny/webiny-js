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

    const test = value.match(/^.{6,}$/);
    if (test === null) {
        throw new _validationError2.default("Password must contain at least 6 characters");
    }
};
//# sourceMappingURL=password.js.map
