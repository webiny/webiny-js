"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

var _webinySqlTable = require("webiny-sql-table");

var _indexes = require("./indexes");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Contains basic indexes. If needed, this class can be extended to add additional indexes,
 * and then be set as a new indexes container as the default one.
 */
class DefaultIndexesContainer extends _webinySqlTable.IndexesContainer {
    key() {
        const index = new _indexes.KeyIndex(
            this.newIndexName,
            this,
            (0, _from2.default)(arguments)
        );
        this.indexes.push(index);
        return index;
    }

    primary() {
        const index = new _indexes.PrimaryIndex(
            this.newIndexName,
            this,
            (0, _from2.default)(arguments)
        );
        this.indexes.push(index);
        return index;
    }

    unique() {
        const index = new _indexes.UniqueIndex(
            this.newIndexName,
            this,
            (0, _from2.default)(arguments)
        );
        this.indexes.push(index);
        return index;
    }

    fullText() {
        const index = new _indexes.FullTextIndex(
            this.newIndexName,
            this,
            (0, _from2.default)(arguments)
        );
        this.indexes.push(index);
        return index;
    }
}

exports.default = DefaultIndexesContainer;
//# sourceMappingURL=indexesContainer.js.map
