"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fileType = require("file-type");

var _fileType2 = _interopRequireDefault(_fileType);

var _webinyFileStorage = require("webiny-file-storage");

var _mdbid = require("mdbid");

var _mdbid2 = _interopRequireDefault(_mdbid);

var _entity = require("./entity");

var _entity2 = _interopRequireDefault(_entity);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class File extends _entity2.default {
    constructor() {
        super();

        this.storageFolder = "/";
        this.tags = [];

        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("title").char();
        this.attr("size").integer();
        this.attr("type").char();
        this.attr("ext").char();
        this.attr("data")
            .buffer("base64")
            .setToStorage(false);
        this.attr("key")
            .char()
            .setSkipOnPopulate();
        this.attr("src").dynamic(() => {
            return /^(https?:)?\/\//.test(this.key) ? this.key : this.getURL();
        });
        this.attr("tags").array();

        // `ref` can be linked with any Entity class so we have to provide a `classIdAttribute` to store related Entity classId
        this.attr("ref").entity([], { classIdAttribute: "refClassId" });
        this.attr("refClassId").char();

        this.attr("order")
            .integer()
            .setDefaultValue(0);
    }

    getURL() {
        this.ensureStorage();
        return this.storage.getURL(this.key);
    }

    getAbsolutePath() {
        this.ensureStorage();
        return this.storage.getAbsolutePath(this.key);
    }

    /**
     * @inheritDoc
     */
    populate(data) {
        if (this.isExisting()) {
            data["data"] ? this.deleteFileFromStorage() : delete data["name"];
        }

        return super.populate(data);
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line
    save(params = {}) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // If new file contents is being saved...
            if (_this.data) {
                _this.ensureStorage();

                let key = _this.key || File.createKey(_this.name);
                if (_this.storageFolder !== "" && !key.startsWith(_this.storageFolder + "/")) {
                    key = _path2.default.join(_this.storageFolder, key);
                }

                _this.key = yield _this.storage.setFile(key, { body: _this.data });
                _this.size = _this.data.length;
                const { ext, mime } = (0, _fileType2.default)(_this.data);
                _this.ext = ext;
                _this.type = mime;
            }

            _this.getAttribute("data").reset();
            return _entity2.default.prototype.save.call(_this, params);
        })();
    }

    /**
     * @inheritDoc
     */
    delete(params = { permanent: true }) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _entity2.default.prototype.delete.call(_this2, params);
            yield _this2.deleteFileFromStorage();
        })();
    }

    /**
     * Set File storage
     *
     * @param {Storage} storage
     *
     * @return this
     */
    setStorage(storage) {
        this.storage = storage;

        return this;
    }

    /**
     * Set storage folder
     *
     * @param {string} folder
     *
     * @return this
     */
    setStorageFolder(folder) {
        if (folder) {
            this.storageFolder = folder;
        }

        return this;
    }

    /**
     * Get file from storage
     *
     * @returns {Promise<IFileData>}
     */
    getFile() {
        this.ensureStorage();
        return this.storage.getFile(this.key);
    }

    /**
     * Create file storage key
     *
     * @param {string} name
     *
     * @return string
     */
    static createKey(name) {
        const { name: base, ext } = _path2.default.parse(name);

        const slug = base
            .toString()
            .toLowerCase()
            .replace(/\s+/g, "-") // Replace spaces with -
            .replace(/[^\w-]+/g, "") // Remove all non-word chars
            .replace(/--+/g, "-") // Replace multiple - with single -
            .replace(/^-+/, "") // Trim - from start of text
            .replace(/-+$/, ""); // Trim - from end of text

        return (0, _mdbid2.default)() + "-" + slug + ext;
    }

    /**
     * Delete current file from storage
     */
    deleteFileFromStorage() {
        this.ensureStorage();
        return this.storage.delete(this.key);
    }

    ensureStorage() {
        if (!(this.storage instanceof _webinyFileStorage.Storage)) {
            throw new Error("No storage configured for File entity!");
        }
    }
}

File.classId = "File";
File.tableName = "Files";

exports.default = File;
//# sourceMappingURL=file.entity.js.map
