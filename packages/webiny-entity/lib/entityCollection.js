"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _entity = require("./entity");

var _entity2 = _interopRequireDefault(_entity);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntityCollection extends Array {
    constructor(values = []) {
        super();
        this.__entityCollection = { params: {}, meta: {} };
        if (Array.isArray(values)) {
            values.map(item => this.push(item));
        }
    }

    setParams(params) {
        this.__entityCollection.params = params;
        return this;
    }

    getParams() {
        return this.__entityCollection.params;
    }

    setMeta(meta) {
        this.__entityCollection.meta = meta;
        return this;
    }

    getMeta() {
        return this.__entityCollection.meta;
    }

    toJSON(fields) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const collection = _this.map(
                (() => {
                    var _ref = (0, _asyncToGenerator3.default)(function*(entity) {
                        if (entity instanceof _entity2.default) {
                            return yield entity.toJSON(fields);
                        }
                        return entity;
                    });

                    return function(_x) {
                        return _ref.apply(this, arguments);
                    };
                })()
            );

            return _promise2.default.all(collection);
        })();
    }

    setTotalCount(totalCount) {
        this.__entityCollection.meta.totalCount = totalCount;
        return this;
    }

    getTotalCount() {
        return this.__entityCollection.meta.totalCount;
    }
}
exports.default = EntityCollection;
//# sourceMappingURL=entityCollection.js.map
