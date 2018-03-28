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

exports.default = value => {
    if (_lodash2.default.isEmpty(value)) {
        if (_lodash2.default.isNumber(value)) {
            return;
        }
        throw new _validationError2.default("Value is required.");
    }
};
//# sourceMappingURL=required.js.map
