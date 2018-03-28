"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _column = require("./column");

var _column2 = _interopRequireDefault(_column);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class TextColumn extends _column2.default {
    getType() {
        return "text";
    }
}
exports.default = TextColumn;
//# sourceMappingURL=textColumn.js.map
