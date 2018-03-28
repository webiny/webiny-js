"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyEntity = require("webiny-entity");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class FileAttribute extends _webinyEntity.EntityAttribute {
    constructor(name, attributesContainer, entity) {
        super(name, attributesContainer, entity);
        this.auto.delete = {
            enabled: true,
            options: { permanent: true }
        };
    }

    /**
     * Set tags that will always be assigned to the file
     *
     * @param tags
     *
     * @return this
     */
    setTags(tags = []) {
        this.tags = tags;

        return this;
    }

    /**
     * Set storage to use with this attribute
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
     * Set folder in which the file will be stored (relative to the root of your storage)
     *
     * @param {string} folder
     *
     * @return this
     */
    setFolder(folder) {
        this.storageFolder = folder;

        return this;
    }

    getValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            let value = yield _webinyEntity.EntityAttribute.prototype.getValue.call(_this);
            if (value instanceof _this.getEntityClass()) {
                if (_this.storage) {
                    value.setStorage(_this.storage).setStorageFolder(_this.storageFolder);
                }
            }

            return value;
        })();
    }

    // $FlowIgnore
    setValue(value) {
        if (Array.isArray(_lodash2.default.get(value, "tags"))) {
            value.tags = _lodash2.default.uniqWith(
                this.tags.concat(value.tags || []),
                _lodash2.default.isEqual
            );
        }

        super.setValue(value);
    }
}

exports.default = FileAttribute;
//# sourceMappingURL=fileAttribute.js.map
