"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _index = require("./../index");

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class FileTable extends _index2.default {
    constructor() {
        super();

        this.column("name").varChar(100);
        this.column("title").varChar(100);
        this.column("size")
            .int(10)
            .setUnsigned();
        this.column("type").varChar(20);
        this.column("ext").varChar(5);
        this.column("src").varChar(250);
        this.column("tags").json();
        this.column("ref").char(24);
        this.column("refClassId").varChar(100);
        this.column("order")
            .smallInt(4)
            .setUnsigned();
    }
}

FileTable.setName("Files");

exports.default = FileTable;
//# sourceMappingURL=file.mysql.js.map
