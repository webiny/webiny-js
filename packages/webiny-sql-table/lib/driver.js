"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _columnsContainer = require("./columnsContainer");

var _columnsContainer2 = _interopRequireDefault(_columnsContainer);

var _indexesContainer = require("./indexesContainer");

var _indexesContainer2 = _interopRequireDefault(_indexesContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Driver {
    getColumnsClass() {
        return _columnsContainer2.default;
    }

    getIndexesClass() {
        return _indexesContainer2.default;
    }

    // eslint-disable-next-line
    create(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return "";
        })();
    }

    // eslint-disable-next-line
    alter(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return "";
        })();
    }

    // eslint-disable-next-line
    drop(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return "";
        })();
    }

    // eslint-disable-next-line
    truncate(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return "";
        })();
    }

    // eslint-disable-next-line
    sync(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return "";
        })();
    }

    // eslint-disable-next-line
    execute(sql) {
        return (0, _asyncToGenerator3.default)(function*() {
            return null;
        })();
    }
}

exports.default = Driver;
//# sourceMappingURL=driver.js.map
