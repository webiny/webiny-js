"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _fecha = require("fecha");

var _fecha2 = _interopRequireDefault(_fecha);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _globby = require("globby");

var _globby2 = _interopRequireDefault(_globby);

var _mimeTypes = require("mime-types");

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _webinyFileStorage = require("webiny-file-storage");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class LocalStorageDriver {
    constructor(config) {
        if (config.publicUrl) {
            config.publicUrl = _lodash2.default.trimEnd(config.publicUrl, "/");
        }

        this.config = config;
    }

    /**
     * Reads the contents of the file
     */
    getFile(key, options) {
        const filePath = _path2.default.join(this.config.directory, key);

        const opts = {};
        if (options && options.encoding) {
            opts.encoding = options.encoding;
        }

        return new _promise2.default((resolve, reject) => {
            _fsExtra2.default.readFile(filePath, opts, (err, data) => {
                if (err) {
                    return reject(new _webinyFileStorage.StorageError(err.message));
                }

                resolve({ body: data });
            });
        });
    }

    /**
     * Writes the given File
     */
    setFile(key, file) {
        if (file.body === null) {
            return _promise2.default.reject(
                new _webinyFileStorage.StorageError("File body must be a string or a Buffer")
            );
        }

        let newKey = key;
        if (this.config.createDatePrefix) {
            if (!/^\d{4}\/\d{2}\/\d{2}\//.test(newKey)) {
                newKey = _path2.default.join(_fecha2.default.format(Date.now(), "YYYY/MM/DD"), key);
            }
        }

        newKey = _lodash2.default.trimStart(newKey, "/");

        const filePath = _path2.default.join(this.config.directory, newKey);
        const content = file.body;
        return _fsExtra2.default.outputFile(filePath, content).then(() => newKey);
    }

    /**
     * Get meta data
     */
    // eslint-disable-next-line
    getMeta(key) {
        return _promise2.default.resolve(null);
    }

    /**
     * Set meta data
     */
    // eslint-disable-next-line
    setMeta(key, meta) {
        return _promise2.default.resolve(true);
    }

    /**
     * Checks whether the file exists
     */
    exists(key) {
        return _fsExtra2.default.pathExists(_path2.default.join(this.config.directory, key));
    }

    /**
     * Returns an array of all keys (files and directories)
     *
     * For storage that doesn't support directories, both parameters are irrelevant.
     *
     * @param key       (Optional) Key of a directory to get keys from. If not set - keys will be read from the storage root.
     * @param filter    (Optional) Glob pattern to filter returned file keys
     */
    getKeys(key, filter) {
        const pattern = _path2.default.join(key || "", filter || "*");

        const options = {
            cwd: this.config.directory,
            root: this.config.directory
        };

        return (0, _globby2.default)(pattern, options).then(arr => {
            return arr.map(file =>
                _lodash2.default.trimStart(file.replace(this.config.directory, ""), "/")
            );
        });
    }

    /**
     * Returns the last modified time
     */
    getTimeModified(key) {
        const filePath = _path2.default.join(this.config.directory, key);
        return new _promise2.default((resolve, reject) => {
            _fsExtra2.default.stat(filePath, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                resolve(stats.mtime.getTime());
            });
        });
    }

    /**
     * Deletes the file
     */
    delete(key) {
        const filePath = _path2.default.join(this.config.directory, key);
        return _fsExtra2.default.remove(filePath).then(() => true);
    }

    /**
     * Renames a file
     */
    rename(sourceKey, targetKey) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const source = _path2.default.join(_this.config.directory, sourceKey);
            const target = _path2.default.join(_this.config.directory, targetKey);
            return _fsExtra2.default.move(source, target).then(function() {
                return true;
            });
        })();
    }

    /**
     * Returns public file URL
     */
    getURL(key) {
        if (!this.config.publicUrl) {
            return key;
        }

        return this.config.publicUrl + key;
    }

    /**
     * Get file size (if supported)
     */
    getSize(key) {
        const filePath = _path2.default.join(this.config.directory, key);
        return new _promise2.default((resolve, reject) => {
            _fsExtra2.default.stat(filePath, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                resolve(stats.size);
            });
        });
    }

    getContentType(key) {
        const filePath = _path2.default.join(this.config.directory, key);
        return _promise2.default.resolve(_mimeTypes2.default.lookup(filePath));
    }

    /**
     * Get absolute file path (if supported).
     * Return original file key if not supported.
     */
    getAbsolutePath(key) {
        return _promise2.default.resolve(_path2.default.join(this.config.directory, key));
    }
}
exports.default = LocalStorageDriver;
//# sourceMappingURL=index.js.map
