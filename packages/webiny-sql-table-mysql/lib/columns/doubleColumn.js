"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _floatColumn = require("./floatColumn");

var _floatColumn2 = _interopRequireDefault(_floatColumn);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class DoubleColumn extends _floatColumn2.default {
    getType() {
        return "double";
    }
}
exports.default = DoubleColumn;
//# sourceMappingURL=doubleColumn.js.map
