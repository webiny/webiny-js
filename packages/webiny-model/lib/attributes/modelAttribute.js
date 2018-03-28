"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _attribute = require("./../attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _model = require("./../model");

var _model2 = _interopRequireDefault(_model);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _index = require("../index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ModelAttribute extends _attribute2.default {
    constructor(name, attributesContainer, model) {
        super(name, attributesContainer);

        // If provided class is not a subclass of Model, we must throw an error.
        if (!(model.prototype instanceof _model2.default)) {
            throw Error(
                `"model" attribute "${name}" received an invalid class (subclass of Model is required).`
            );
        }

        this.modelClass = model;
    }

    getModelClass() {
        return this.modelClass;
    }

    getModelInstance() {
        const modelClass = this.getModelClass();
        return new modelClass();
    }

    setValue(value) {
        if (!this.canSetValue()) {
            return;
        }

        let newValue = null;
        if (value instanceof _model2.default) {
            newValue = value;
        } else if (_lodash2.default.isObject(value)) {
            newValue = this.getModelInstance();
            newValue.populate(value);
        } else {
            newValue = value;
        }

        this.value.setCurrent(newValue);
    }

    getJSONValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = _this.getValue();
            if (value instanceof _model2.default) {
                return {};
            }
            return value;
        })();
    }

    getStorageValue() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _this2.getValue();
            if (value instanceof _model2.default) {
                return yield value.toStorage();
            }
            return value;
        })();
    }

    setStorageValue(value) {
        const newValue = this.getModelInstance().populateFromStorage(value);
        this.value.setCurrent(newValue, { skipDifferenceCheck: true });
        return this;
    }

    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of Model.
     */
    validateType(value) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (value instanceof _this3.getModelClass()) {
                return;
            }
            _this3.expected("instance of Model class", typeof value);
        })();
    }

    /**
     * We can be sure that value is an instance of Model since otherwise this point would not be reached
     * (because of the validateType method above).
     * @param value
     * @returns {Promise<void>}
     */
    validateValue(value) {
        return (0, _asyncToGenerator3.default)(function*() {
            const currentValue = value;
            yield currentValue.validate();
        })();
    }
}

exports.default = ModelAttribute;
//# sourceMappingURL=modelAttribute.js.map
