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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyDataExtractor = require("webiny-data-extractor");

var _webinyDataExtractor2 = _interopRequireDefault(_webinyDataExtractor);

var _defaultAttributesContainer = require("./defaultAttributesContainer");

var _defaultAttributesContainer2 = _interopRequireDefault(_defaultAttributesContainer);

var _modelError = require("./modelError");

var _modelError2 = _interopRequireDefault(_modelError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Model {
    constructor(params) {
        this.attributes = {};
        this.validating = false;
        this.attributesContainer = this.createAttributesContainer();

        if (params) {
            if (typeof params === "function") {
                params.call(this);
            } else if (typeof params === "object") {
                // Here, params can be an object, which may contain several options.
                if (typeof params.definition === "function") {
                    params.definition.call(this);
                }
            }
        }

        return new Proxy(this, {
            set: (instance, key, value) => {
                const attr = instance.getAttribute(key);
                if (attr) {
                    attr.setValue(value);
                    return true;
                }

                instance[key] = value;
                return true;
            },
            get: (instance, key) => {
                const attr = instance.getAttribute(key);
                if (attr) {
                    return attr.getValue();
                }

                return instance[key];
            }
        });
    }

    attr(attribute) {
        return this.getAttributesContainer().attr(attribute);
    }

    createAttributesContainer() {
        return new _defaultAttributesContainer2.default(this);
    }

    getAttributesContainer() {
        return this.attributesContainer;
    }

    getAttribute(attribute) {
        if (_lodash2.default.has(this.attributes, attribute)) {
            return this.attributes[attribute];
        }
    }

    setAttribute(name, attribute) {
        this.attributes[name] = attribute;
        return this;
    }

    getAttributes() {
        return this.attributes;
    }

    clean() {
        _lodash2.default.each(this.attributes, attribute => {
            attribute.value.clean();
        });
    }

    isDirty() {
        let name;
        for (name in this.attributes) {
            const attribute = this.attributes[name];
            if (attribute.value.isDirty()) {
                return true;
            }
        }
        return false;
    }

    isClean() {
        return !this.isDirty();
    }

    /**
     * Populates the model with given data.
     */
    populate(data) {
        if (!_lodash2.default.isObject(data)) {
            throw new _modelError2.default(
                "Populate failed - received data not an object.",
                _modelError2.default.POPULATE_FAILED_NOT_OBJECT
            );
        }

        _lodash2.default.each(this.attributes, (attribute, name) => {
            if (attribute.getSkipOnPopulate()) {
                return;
            }

            if (_lodash2.default.has(data, name)) {
                attribute.setValue(data[name]);
            }
        });

        return this;
    }

    /**
     * Validates values of all attributes.
     */
    validate() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this.validating) {
                return;
            }
            _this.validating = true;

            const invalidAttributes = {};
            yield _promise2.default.all(
                (0, _keys2.default)(_this.attributes).map(
                    (() => {
                        var _ref = (0, _asyncToGenerator3.default)(function*(name) {
                            const attribute = _this.attributes[name];
                            try {
                                yield attribute.validate();
                            } catch (e) {
                                if (e instanceof _modelError2.default) {
                                    invalidAttributes[name] = {
                                        code: e.code,
                                        data: e.data,
                                        message: e.message
                                    };
                                } else {
                                    invalidAttributes[name] = {
                                        code: _modelError2.default.INVALID_ATTRIBUTE,
                                        data: null,
                                        message: e.message
                                    };
                                }
                            }
                        });

                        return function(_x) {
                            return _ref.apply(this, arguments);
                        };
                    })()
                )
            );

            _this.validating = false;

            if (!_lodash2.default.isEmpty(invalidAttributes)) {
                throw new _modelError2.default(
                    "Validation failed.",
                    _modelError2.default.INVALID_ATTRIBUTES,
                    {
                        invalidAttributes
                    }
                );
            }
        })();
    }

    toJSON(fields) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return yield _webinyDataExtractor2.default.get(_this2, fields, {
                onRead: (() => {
                    var _ref2 = (0, _asyncToGenerator3.default)(function*(data, key) {
                        // Key can accept ":" separated arguments, so we have to make sure those are parsed.
                        const received = _this2.__parseKeyParams(key);

                        if (typeof data.getAttribute === "function") {
                            if (!data.getAttribute(received.key)) {
                                return [received.key];
                            }
                            return [
                                received.key,
                                yield data
                                    .getAttribute(received.key)
                                    .getJSONValue(...received.arguments)
                            ];
                        }
                        return [received.key, yield data[received.key]];
                    });

                    return function onRead(_x2, _x3) {
                        return _ref2.apply(this, arguments);
                    };
                })()
            });
        })();
    }

    get(path = "", defaultValue) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const steps = typeof path === "string" ? path.split(".") : path;
            let value = _this3;
            for (let i = 0; i < steps.length; i++) {
                if (!_lodash2.default.isObject(value)) {
                    return defaultValue;
                }

                // Key can accept ":" separated arguments, so we have to make sure those are parsed.
                const received = _this3.__parseKeyParams(steps[i]);

                if (typeof value.getAttribute === "function") {
                    if (value.getAttribute(received.key)) {
                        value = yield value
                            .getAttribute(received.key)
                            .getValue(...received.arguments);
                    } else {
                        return defaultValue;
                    }
                } else {
                    value = yield value[steps[i]];
                }
            }
            return value;
        })();
    }

    __parseKeyParams(key) {
        const received = { arguments: key.split(":"), key: "" };
        received.key = received.arguments.shift();
        return received;
    }

    set(path, value) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const steps = path.split(".");
            const lastStep = steps.pop();

            const model = yield _this4.get(steps);
            if (model && model.getAttribute) {
                const attribute = model.getAttribute(lastStep);
                if (attribute) {
                    return attribute.setValue(value);
                }
            }
        })();
    }

    /**
     * Returns data that is suitable for latter saving in a storage layer (database, caching etc.). This is useful because attributes can
     * have different values here (eg. only ID sometimes is needed) and also some attributes don't even need to be saved in the storage,
     * which is most often the case with dynamic attributes.
     */
    toStorage() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const json = {};
            for (let name in _this5.getAttributes()) {
                const attribute = _this5.getAttribute(name);
                // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                if (attribute.getToStorage()) {
                    // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                    json[name] = yield attribute.getStorageValue();
                }
            }

            return json;
        })();
    }

    populateFromStorage(data) {
        if (!_lodash2.default.isObject(data)) {
            throw new _modelError2.default(
                "Populate failed - received data not an object.",
                _modelError2.default.POPULATE_FAILED_NOT_OBJECT
            );
        }

        let name;
        for (name in this.getAttributes()) {
            const attribute = this.getAttribute(name);
            _lodash2.default.has(data, name) &&
                // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                attribute.getToStorage() &&
                // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                attribute.setStorageValue(data[name]);
        }

        return this;
    }
}

exports.default = Model;
//# sourceMappingURL=model.js.map
