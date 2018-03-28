"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _filesAttribute = require("./filesAttribute");

var _filesAttribute2 = _interopRequireDefault(_filesAttribute);

var _index = require("./../index");

var _imageAttribute = require("./imageAttribute");

var _imageAttribute2 = _interopRequireDefault(_imageAttribute);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ImagesAttribute extends _filesAttribute2.default {
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
            let values = yield _filesAttribute2.default.prototype.getValue.call(_this);
            values.map(function(value) {
                if (value instanceof _this.getEntitiesClass()) {
                    value.setProcessor(_this.processor);
                    value.setQuality(_this.quality);
                    value.setPresets(_this.presets);
                }
            });

            return values;
        })();
    }

    // $FlowIgnore
    setValue(value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _filesAttribute2.default.prototype.setValue.call(_this2, value);
            const values = yield _this2.getValue();

            values.map(function(value) {
                if (value instanceof _this2.getEntitiesClass()) {
                    value.setPresets(_this2.presets);
                    value.setQuality(_this2.quality);
                    value.setProcessor(_this2.processor);
                }
            });

            return _this2;
        })();
    }
}

exports.default = ImagesAttribute;
//# sourceMappingURL=imagesAttribute.js.map
