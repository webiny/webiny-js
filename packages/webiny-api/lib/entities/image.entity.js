"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _file = require("./file.entity");

var _file2 = _interopRequireDefault(_file);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Image extends _file2.default {
    constructor() {
        super();

        this.presets = {};

        this.attr("preset")
            .char()
            .setDefaultValue("original");
        this.attr("width")
            .integer()
            .setSkipOnPopulate();
        this.attr("height")
            .integer()
            .setSkipOnPopulate();
        this.attr("src").dynamic(preset => {
            return /^(https?:)?\/\//.test(this.key) ? this.key : this.getURL(preset);
        });
        this.attr("aspectRatio").dynamic(() => {
            if (this.height) {
                return parseFloat((this.width / this.height).toFixed(3));
            }

            return 0;
        });
        this.attr("isPortrait").dynamic(() => {
            return this.aspectRatio <= 1;
        });
        this.attr("isLandscape").dynamic(() => {
            return this.aspectRatio > 1;
        });
    }

    static find(params = {}) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!_lodash2.default.has(params, "query.preset")) {
                _lodash2.default.set(params, "query.preset", "original");
            }

            return _file2.default.find.call(_this, params);
        })();
    }

    // eslint-disable-next-line
    save(params = {}) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this2.data) {
                const imageSize = yield _promise2.default
                    .resolve()
                    .then(() => require("image-size"));
                const { width, height } = imageSize(_this2.data);
                _this2.width = width;
                _this2.height = height;
            }

            return _file2.default.prototype.save.call(_this2, params);
        })();
    }

    delete(params = { permanent: true }) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _file2.default.prototype.delete.call(_this3, params);
            const sizes = yield _this3.getDerivedImages();
            for (let i = 0; i < sizes.length; i++) {
                const image = sizes[i];
                yield image.delete();
            }
        })();
    }

    getURL(preset) {
        if (!preset) {
            this.ensureStorage();
            return this.storage.getURL(this.key);
        }

        return this.getPresetURL(preset);
    }

    setPresets(presets = {}) {
        this.presets = presets;

        return this;
    }

    setQuality(quality) {
        this.quality = quality;

        return this;
    }

    setProcessor(processor) {
        this.processor = processor;

        return this;
    }

    getPresetURL(preset) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (preset === "original") {
                return _this4.getURL();
            }

            const presetFile = yield Image.findOne({
                query: { ref: _this4.classId + ":" + _this4.id, preset }
            });
            if (presetFile) {
                return presetFile.setStorage(_this4.storage).getURL();
            }

            // Build preset key based on the original key + name of the preset
            const { dir, name, ext } = _path2.default.parse(_this4.key);
            let presetKey = _path2.default.join(dir, name + "-" + preset) + ext;

            const currentFile = yield _this4.storage.getFile(_this4.key);
            const newImage = yield _this4.processor({
                image: currentFile.body,
                transformations: _this4.presets[preset]
            });

            // Create new entity
            const ImageClass = _this4.constructor;
            const presetImage = new ImageClass();
            presetImage.key = presetKey;

            presetImage.setStorage(_this4.storage);
            presetImage.setStorageFolder(_this4.storageFolder);
            presetImage.setProcessor(_this4.pr);

            presetImage.populate({
                ref: _this4,
                name: _this4.name,
                title: _this4.title,
                data: newImage,
                preset,
                tags: _this4.tags,
                type: _this4.type,
                ext: _this4.ext
            });
            yield presetImage.save();

            return presetImage.getURL();
        })();
    }

    deleteFileFromStorage() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this5.preset === "original") {
                const sizes = yield _this5.getDerivedImages();
                for (let i = 0; i < sizes.length; i++) {
                    const image = sizes[i];
                    yield image.delete();
                }
            }

            return _file2.default.prototype.deleteFileFromStorage.call(_this5);
        })();
    }

    /**
     * Get existing sizes of this file
     *
     * @return {EntityCollection}
     */
    getDerivedImages() {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sizes = yield Image.find({
                query: {
                    preset: { $ne: "original" },
                    ref: _this6.classId + ":" + _this6.id
                }
            });

            return sizes.map(function(size) {
                size.setStorage(_this6.storage);
                return _this6;
            });
        })();
    }
}

Image.classId = "Image";
Image.tableName = "Images";

exports.default = Image;
//# sourceMappingURL=image.entity.js.map
