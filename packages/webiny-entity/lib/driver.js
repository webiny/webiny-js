"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _queryResult = require("./queryResult");

var _queryResult2 = _interopRequireDefault(_queryResult);

var _entityModel = require("./entityModel");

var _entityModel2 = _interopRequireDefault(_entityModel);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Driver {
    constructor() {
        this.connection = null;
    }

    // eslint-disable-next-line
    onEntityConstruct(entity) {}

    getModelClass() {
        return _entityModel2.default;
    }

    // eslint-disable-next-line
    save(entity, params) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _queryResult2.default();
        })();
    }

    // eslint-disable-next-line
    delete(entity, params) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _queryResult2.default();
        })();
    }

    // eslint-disable-next-line
    findOne(
        entity,
        params // eslint-disable-line
    ) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _queryResult2.default();
        })();
    }

    // eslint-disable-next-line
    find(
        entity,
        params // eslint-disable-line
    ) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _queryResult2.default();
        })();
    }

    // eslint-disable-next-line
    count(
        entity,
        params // eslint-disable-line
    ) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _queryResult2.default(0);
        })();
    }

    getConnection() {
        return this.connection;
    }

    // eslint-disable-next-line
    isId(entity, id, params) {
        return typeof id === "string";
    }
}

exports.default = Driver;
//# sourceMappingURL=driver.js.map
