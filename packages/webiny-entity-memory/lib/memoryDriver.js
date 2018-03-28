"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyEntity = require("webiny-entity");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _mdbid = require("mdbid");

var _mdbid2 = _interopRequireDefault(_mdbid);

var _types = require("webiny-entity/types");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * MemoryDriver is an implementation of in-memory entity driver.
 * Its main purpose is to run tests without the need to mock the driver.
 * Using this class you get the exact behavior of the entity storage as if using a real database, except it only exists as long as the process is running.
 */
class MemoryDriver extends _webinyEntity.Driver {
    constructor() {
        super();
        this.data = {};
    }

    // eslint-disable-next-line
    save(entity, params) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // Check if table exists.
            if (!_this.data[entity.classId]) {
                _this.data[entity.classId] = [];
            }

            if (entity.isExisting()) {
                const storedItemIndex = _lodash2.default.findIndex(_this.data[entity.classId], {
                    id: entity.id
                });
                _this.data[entity.classId][storedItemIndex] = yield entity.toStorage();
                return new _webinyEntity.QueryResult(true);
            }

            entity.id = (0, _mdbid2.default)();
            _this.data[entity.classId].push(yield entity.toStorage());
            return new _webinyEntity.QueryResult(true);
        })();
    }

    // eslint-disable-next-line
    delete(entity, params) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!_this2.data[entity.classId]) {
                return new _webinyEntity.QueryResult(true);
            }

            const index = _lodash2.default.findIndex(_this2.data[entity.classId], {
                id: entity.id
            });
            if (index > -1) {
                _this2.data[entity.classId].splice(index, 1);
            }
            return new _webinyEntity.QueryResult(true);
        })();
    }

    // eslint-disable-next-line
    count(entity, params) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const results = yield _this3.find(entity, params);
            return new _webinyEntity.QueryResult(results.getResult().length);
        })();
    }

    findOne(entity, params) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return new _webinyEntity.QueryResult(
                _lodash2.default.find(_this4.data[entity.classId], params.query)
            );
        })();
    }

    // eslint-disable-next-line
    find(entity, params) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const records = _this5.data[entity.classId];
            if (!records) {
                return new _webinyEntity.QueryResult([]);
            }

            const query = _lodash2.default.get(params, "query", {});
            if (_lodash2.default.isEmpty(query)) {
                return new _webinyEntity.QueryResult(_this5.data[entity.classId]);
            }

            const collection = [];

            _this5.data[entity.classId].forEach(function(record) {
                for (const [key, value] of (0, _entries2.default)(query)) {
                    if (value instanceof Array) {
                        if (!value.includes(record[key])) {
                            return true;
                        }
                    } else if (record[key] !== value) {
                        return true;
                    }
                }
                collection.push(record);
            });

            return new _webinyEntity.QueryResult(collection, { count: collection.length });
        })();
    }

    flush(classId) {
        if (classId) {
            _lodash2.default.has(this.data, classId) && delete this.data[classId];
        } else {
            this.data = {};
        }
        return this;
    }

    import(classId, data) {
        data.forEach((item, index) => {
            if (!item.id) {
                throw Error("Failed importing data - missing ID for item on index " + index + ".");
            }
        });

        if (!this.data[classId]) {
            this.data[classId] = [];
        }

        data.forEach(importedItem => {
            const storedItemIndex = _lodash2.default.findIndex(this.data[classId], {
                id: importedItem.id
            });
            if (storedItemIndex === -1) {
                this.data[classId].push(importedItem);
            } else {
                this.data[classId][storedItemIndex] = importedItem;
            }
        });

        return this;
    }
}
exports.default = MemoryDriver;
//# sourceMappingURL=memoryDriver.js.map
