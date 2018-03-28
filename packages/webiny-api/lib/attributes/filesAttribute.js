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

class FilesAttribute extends _webinyEntity.EntitiesAttribute {
    constructor(name, attributesContainer, entity) {
        super(name, attributesContainer, entity, "ref", () => {
            // $FlowIgnore
            const classId = this.getParentModel().getParentEntity().classId;
            // $FlowIgnore
            const id = this.getParentModel()
                .getAttribute("id")
                .getStorageValue();
            return classId + ":" + id;
        });
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
            let values = yield _webinyEntity.EntitiesAttribute.prototype.getValue.call(_this);
            values.map(function(value) {
                if (value instanceof _this.getEntitiesClass()) {
                    if (_this.storage) {
                        value.setStorage(_this.storage).setStorageFolder(_this.storageFolder);
                    }
                }
            });

            return values;
        })();
    }

    // $FlowIgnore
    setValue(value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _webinyEntity.EntitiesAttribute.prototype.setValue.call(_this2, value);
            const values = yield _this2.getValue();

            values.map(function(value) {
                if (value instanceof _this2.getEntitiesClass()) {
                    value.tags = _lodash2.default.uniqWith(
                        _this2.tags.concat(value.tags || []),
                        _lodash2.default.isEqual
                    );
                    if (_this2.storage) {
                        value.setStorage(_this2.storage).setStorageFolder(_this2.storageFolder);
                    }
                }
            });

            return _this2;
        })();
    }
}

exports.default = FilesAttribute;
//# sourceMappingURL=filesAttribute.js.map
