"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _intColumn = require("./intColumn");

var _intColumn2 = _interopRequireDefault(_intColumn);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class SmallIntColumn extends _intColumn2.default {
    getType() {
        return "smallint";
    }
}
exports.default = SmallIntColumn;
//# sourceMappingURL=smallIntColumn.js.map
