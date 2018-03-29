"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

var _webinySqlTable = require("webiny-sql-table");

var _columns = require("./columns");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Contains basic columns. If needed, this class can be extended to add additional columns,
 * and then be set as a new columns container as the default one.
 */
class ColumnsContainer extends _webinySqlTable.ColumnsContainer {
    bigInt() {
        const column = new _columns.BigIntColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    blob() {
        const column = new _columns.BlobColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    char() {
        const column = new _columns.CharColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    date() {
        const column = new _columns.DateColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    dateTime() {
        const column = new _columns.DateTimeColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    decimal() {
        const column = new _columns.DecimalColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    double() {
        const column = new _columns.DoubleColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    enum() {
        const column = new _columns.EnumColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    float() {
        const column = new _columns.FloatColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    int() {
        const column = new _columns.IntColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    json() {
        const column = new _columns.JSONColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    longBlob() {
        const column = new _columns.LongBlobColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    longText() {
        const column = new _columns.LongTextColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    mediumBlob() {
        const column = new _columns.MediumBlobColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    mediumInt() {
        const column = new _columns.MediumIntColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    mediumText() {
        const column = new _columns.MediumTextColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    smallInt() {
        const column = new _columns.SmallIntColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    text() {
        const column = new _columns.TextColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    time() {
        const column = new _columns.TimeColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    timestamp() {
        const column = new _columns.TimestampColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    tinyInt() {
        const column = new _columns.TinyIntColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    tinyText() {
        const column = new _columns.TinyTextColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }

    varChar() {
        const column = new _columns.VarCharColumn(
            this.newColumnName,
            this,
            (0, _from2.default)(arguments)
        );
        this.columns.push(column);
        return column;
    }

    year() {
        const column = new _columns.YearColumn(this.newColumnName, this);
        this.columns.push(column);
        return column;
    }
}

exports.default = ColumnsContainer;
//# sourceMappingURL=columnsContainer.js.map
