"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _intColumn = require("./intColumn");

var _intColumn2 = _interopRequireDefault(_intColumn);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MediumIntColumn extends _intColumn2.default {
    getType() {
        return "mediumint";
    }
}
exports.default = MediumIntColumn;
//# sourceMappingURL=mediumIntColumn.js.map
