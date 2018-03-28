"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const traverse = obj => {
    _lodash2.default.forOwn(obj, (val, key) => {
        if (_lodash2.default.isArray(val)) {
            val.forEach(el => {
                traverse(el);
            });
        } else if (_lodash2.default.isObject(val)) {
            traverse(val);
        } else {
            if (val === "true") {
                obj[key] = true;
            } else if (val === "false") {
                obj[key] = false;
            }
        }
    });
};

exports.default = traverse;
//# sourceMappingURL=parseBoolean.js.map
