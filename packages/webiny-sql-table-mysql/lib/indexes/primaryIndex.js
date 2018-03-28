"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _index = require("./index");

class PrimaryIndex extends _index.KeyIndex {
    getType() {
        return "PRIMARY";
    }

    getSQLValue() {
        return `PRIMARY KEY (${this.getColumns()
            .map(item => `\`${item}\``)
            .join(", ")})`;
    }

    /**
     * Primary indexes don't have a name, so it's safe to return null here.
     * @returns {null}
     */
    getName() {
        return null;
    }
}
exports.default = PrimaryIndex;
//# sourceMappingURL=primaryIndex.js.map
