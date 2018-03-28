"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _storage = require("./storage");

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class File {
    constructor(key, storage) {
        this.key = key;
        this.storage = storage;
        this.file = { body: "" };
        this.bodyLoaded = false;
        this.metaLoaded = false;
    }

    /**
     * Get file storage
     */
    getStorage() {
        return this.storage;
    }

    /**
     * Get file key
     */
    getKey() {
        return this.key;
    }

    /**
     * Get public file URL
     */
    getUrl() {
        return this.storage.getURL(this.key);
    }

    /**
     * Get file body
     */
    getBody(options) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!_this.bodyLoaded) {
                _this.file = yield _this.storage.getFile(_this.key, options);
                _this.bodyLoaded = true;
                _this.metaLoaded = true;
            }
            return _this.file.body;
        })();
    }

    /**
     * Get file meta
     */
    getMeta() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!_this2.metaLoaded) {
                _this2.file.meta = yield _this2.storage.getMeta(_this2.key);
                _this2.metaLoaded = true;
            }
            return _this2.file.meta;
        })();
    }

    /**
     * Set file contents (writes contents to storage)
     */
    setBody(data) {
        this.file.body = data;
        this.bodyLoaded = true;
    }

    /**
     * Set file meta
     */
    setMeta(meta) {
        this.file.meta = meta;
        this.metaLoaded = true;
    }

    /**
     * Get time modified
     */
    getTimeModified() {
        return this.storage.getTimeModified(this.key);
    }

    /**
     * Rename a file
     */
    rename(newKey) {
        return this.storage.rename(this.key, newKey);
    }

    /**
     * Delete a file
     */
    delete() {
        return this.storage.delete(this.key);
    }

    /**
     * Save file (call `setFile` on Storage instance)
     */
    save() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            _this3.key = yield _this3.storage.setFile(_this3.key, _this3.file);
            return true;
        })();
    }

    /**
     * Get absolute file path.
     * If storage driver does not support absolute paths (cloud storage), returns file key
     *
     * @return string
     */
    getAbsolutePath() {
        return this.storage.getAbsolutePath(this.key);
    }

    /**
     * Get file size in bytes
     */
    getSize() {
        return this.storage.getSize(this.key);
    }

    /**
     * Get content type
     */
    getContentType(key) {
        return this.storage.getContentType(key);
    }
}
exports.default = File;
//# sourceMappingURL=file.js.map
