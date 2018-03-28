"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _attribute = require("./../attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _model = require("./../model");

var _model2 = _interopRequireDefault(_model);

var _modelError = require("./../modelError");

var _modelError2 = _interopRequireDefault(_modelError);

var _index = require("../index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ModelsAttribute extends _attribute2.default {
    constructor(name, attributesContainer, model) {
        super(name, attributesContainer);

        // If provided class is not a subclass of Model, we must throw an error.
        if (!(model.prototype instanceof _model2.default)) {
            throw Error(
                `"models" attribute "${name}" received an invalid class (subclass of Model is required).`
            );
        }

        this.value.current = [];
        this.modelClass = model;
    }

    getModelClass() {
        return this.modelClass;
    }

    getModelInstance() {
        const modelClass = this.getModelClass();
        return new modelClass();
    }

    setValue(values) {
        if (!this.canSetValue()) {
            return;
        }

        this.value.set = true;

        // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
        if (!(values instanceof Array)) {
            this.value.setCurrent(values);
            return;
        }

        let newValues = [];
        for (let i = 0; i < values.length; i++) {
            if (_lodash2.default.isPlainObject(values[i])) {
                const newValue = this.getModelInstance();
                newValue.populate(_lodash2.default.clone(values[i]));
                newValues.push(newValue);
            } else {
                newValues.push(values[i]);
            }
        }
        this.value.setCurrent(newValues);
    }

    getValue() {
        return super.getValue();
    }

    getJSONValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = _this.value.getCurrent();
            if (value instanceof Array) {
                const json = [];
                for (let i = 0; i < value.length; i++) {
                    json.push({});
                }
                return json;
            }

            return value;
        })();
    }

    getStorageValue() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = _this2.getValue();
            if (value instanceof Array) {
                const data = [];
                for (let i = 0; i < value.length; i++) {
                    data.push(yield value[i].toStorage());
                }
                return data;
            }
            return [];
        })();
    }

    setStorageValue(value) {
        const newValue = [];
        if (Array.isArray(value)) {
            value.forEach(item => {
                newValue.push(this.getModelInstance().populateFromStorage(item));
            });

            this.value.setCurrent(newValue, { skipDifferenceCheck: true });
        }
        return this;
    }

    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of Model.
     */
    validateType(value) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (value instanceof Array) {
                return;
            }
            _this3.expected("array", typeof value);
        })();
    }

    validateValue(value) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const arrayValue = value;
            // This validates on all of the model's levels.
            const errors = [];

            for (let i = 0; i < arrayValue.length; i++) {
                const current = arrayValue[i];
                if (!(current instanceof _this4.getModelClass())) {
                    errors.push({
                        code: _modelError2.default.INVALID_ATTRIBUTE,
                        data: {
                            index: i
                        },
                        message: `Validation failed, item at index ${i} not an instance of Model class.`
                    });
                    continue;
                }
                try {
                    yield current.validate();
                } catch (e) {
                    errors.push({
                        code: e.code,
                        data: (0, _assign2.default)({ index: i }, e.data),
                        message: e.message
                    });
                }
            }

            if (!_lodash2.default.isEmpty(errors)) {
                throw new _modelError2.default(
                    "Validation failed.",
                    _modelError2.default.INVALID_ATTRIBUTE,
                    {
                        items: errors
                    }
                );
            }
        })();
    }
}
exports.default = ModelsAttribute;
//# sourceMappingURL=modelsAttribute.js.map
