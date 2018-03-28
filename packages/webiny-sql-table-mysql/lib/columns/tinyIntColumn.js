"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _intColumn = require("./intColumn");

var _intColumn2 = _interopRequireDefault(_intColumn);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class TinyIntColumn extends _intColumn2.default {
    getType() {
        return "tinyint";
    }
}
exports.default = TinyIntColumn;
//# sourceMappingURL=tinyIntColumn.js.map
