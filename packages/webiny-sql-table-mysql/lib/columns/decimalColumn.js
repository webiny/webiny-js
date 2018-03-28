"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _floatColumn = require("./floatColumn");

var _floatColumn2 = _interopRequireDefault(_floatColumn);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class DecimalColumn extends _floatColumn2.default {
    getType() {
        return "decimal";
    }
}
exports.default = DecimalColumn;
//# sourceMappingURL=decimalColumn.js.map
