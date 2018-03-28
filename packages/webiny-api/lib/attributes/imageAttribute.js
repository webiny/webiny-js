"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _fileAttribute = require("./fileAttribute");

var _fileAttribute2 = _interopRequireDefault(_fileAttribute);

var _image = require("../entities/image.entity");

var _image2 = _interopRequireDefault(_image);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ImageAttribute extends _fileAttribute2.default {
    setProcessor(processor) {
        this.processor = processor;
        return this;
    }

    setQuality(quality) {
        this.quality = quality;
        return this;
    }

    setPresets(presets = {}) {
        this.presets = presets;

        return this;
    }

    getValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            let value = yield _fileAttribute2.default.prototype.getValue.call(_this);
            if (value instanceof _this.getEntityClass()) {
                value.setProcessor(_this.processor);
                value.setQuality(_this.quality);
                value.setPresets(_this.presets);
                if (_this.storage) {
                    value.setStorage(_this.storage).setStorageFolder(_this.storageFolder);
                }
            }

            return value;
        })();
    }

    // $FlowIgnore
    setValue(value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const currentValue = yield _this2.getValue();
            yield _fileAttribute2.default.prototype.setValue.call(_this2, value);

            const newValue = yield _this2.getValue();
            if (newValue instanceof _this2.getEntityClass()) {
                newValue.setPresets(_this2.presets);
                newValue.setQuality(_this2.quality);
                newValue.setProcessor(_this2.processor);
                newValue.tags = _lodash2.default.uniqWith(
                    _this2.tags.concat(newValue.tags),
                    _lodash2.default.isEqual
                );
                if (_this2.storage) {
                    newValue.setStorage(_this2.storage).setStorageFolder(_this2.storageFolder);
                }
            }

            // If new value is being assigned and there is an existing file - delete the existing file after a successful save
            if (currentValue && (!newValue || currentValue.id !== newValue.id)) {
                _this2
                    .getParentModel()
                    .getParentEntity()
                    .on(
                        "afterSave",
                        (0, _asyncToGenerator3.default)(function*() {
                            yield currentValue.delete();
                        })
                    )
                    .setOnce();
            }

            return _this2;
        })();
    }
}
exports.default = ImageAttribute;
//# sourceMappingURL=imageAttribute.js.map
