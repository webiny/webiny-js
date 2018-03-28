"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _file = require("./file.mysql");

var _file2 = _interopRequireDefault(_file);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ImageTable extends _file2.default {
    constructor() {
        super();

        this.column("preset").varChar(20);
        this.column("width")
            .mediumInt()
            .setUnsigned();
        this.column("height")
            .mediumInt()
            .setUnsigned();
    }
}

ImageTable.setName("Images");

exports.default = ImageTable;
//# sourceMappingURL=image.mysql.js.map
