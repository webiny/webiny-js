"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _column = require("./column");

var _column2 = _interopRequireDefault(_column);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class BlobColumn extends _column2.default {
    getType() {
        return "blob";
    }
}
exports.default = BlobColumn;
//# sourceMappingURL=blobColumn.js.map
