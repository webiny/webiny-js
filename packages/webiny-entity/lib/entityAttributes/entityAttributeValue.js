"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

var _webinyEntity = require("webiny-entity");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntityAttributeValue extends _webinyModel.AttributeValue {
    constructor(attribute) {
        super(attribute);
        this.queue = [];

        // Contains initial value received upon loading from storage. If the current value becomes different from initial,
        // upon save, old entity must be removed. This is only active when auto delete option on the attribute is enabled,
        // which then represents a one to one relationship.
        this.initial = null;
    }

    /**
     * Ensures data is loaded correctly, and in the end returns current value.
     * @returns {Promise<*>}
     */
    load() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this.isLoading()) {
                return new _promise2.default(function(resolve) {
                    _this.queue.push(resolve);
                });
            }

            if (_this.isLoaded()) {
                return;
            }

            _this.state.loading = true;

            // Only if we have a valid ID set, we must load linked entity.
            const initial = _this.getInitial();
            if (
                _this.attribute
                    .getParentModel()
                    .getParentEntity()
                    .isId(initial)
            ) {
                const entity = yield _this.attribute.getEntityClass().findById(initial);
                _this.setInitial(entity);
                // If current value is not dirty, than we can set initial value as current, otherwise we
                // assume that something else was set as current value like a new entity.
                if (_this.isClean()) {
                    _this.setCurrent(entity, { skipDifferenceCheck: true });
                }
            }

            _this.state.loading = false;
            _this.state.loaded = true;

            yield _this.__executeQueue();

            return _this.getCurrent();
        })();
    }

    deleteInitial(options) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!_this2.hasInitial()) {
                return;
            }

            // Initial value will always be an existing (already saved) Entity instance.
            const initial = _this2.getInitial();
            if (
                initial instanceof _webinyEntity.Entity &&
                _lodash2.default.get(initial, "id") !==
                    _lodash2.default.get(_this2.getCurrent(), "id")
            ) {
                yield initial.delete(options);
            }
        })();
    }

    syncInitial() {
        this.setInitial(this.getCurrent());
    }

    setInitial(value) {
        this.initial = value;
        return this;
    }

    getInitial() {
        return this.initial;
    }

    hasInitial() {
        return this.initial instanceof this.attribute.getEntityClass();
    }

    /**
     * Value cannot be set as clean if there is no ID present.
     * @returns {EntityAttributeValue}
     */
    clean() {
        if (_lodash2.default.get(this.getCurrent(), "id")) {
            return super.clean();
        }

        return this;
    }

    isDifferentFrom(value) {
        const differentIds =
            _lodash2.default.get(this.current, "id", this.current) !==
            _lodash2.default.get(value, "id", value);
        if (differentIds) {
            return true;
        }

        // IDs are the same at this point.
        if (value instanceof Object) {
            if (value.id) {
                return (0, _keys2.default)(value).length > 1;
            }
            return true;
        }

        return false;
    }

    __executeQueue() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this3.queue.length) {
                for (let i = 0; i < _this3.queue.length; i++) {
                    yield _this3.queue[i]();
                }
                _this3.queue = [];
            }
        })();
    }
}
exports.default = EntityAttributeValue;
//# sourceMappingURL=entityAttributeValue.js.map
