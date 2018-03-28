"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (value, params) => {
    if (!value) return;

    let lengthOfValue = null;
    if (_lodash2.default.has(value, "length")) {
        lengthOfValue = value.length;
    } else if (_lodash2.default.isObject(value)) {
        lengthOfValue = _lodash2.default.keys(value).length;
    }

    if (lengthOfValue === null || lengthOfValue >= params[0]) {
        return;
    }

    if (_lodash2.default.isString(value)) {
        throw new _validationError2.default(
            "Value requires at least " + params[0] + " characters."
        );
    }
    throw new _validationError2.default("Value requires at least " + params[0] + " items.");
};
//# sourceMappingURL=minLength.js.map
