"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _webinyApi = require("webiny-api");

var _fileAttribute = require("./fileAttribute");

var _fileAttribute2 = _interopRequireDefault(_fileAttribute);

var _filesAttribute = require("./filesAttribute");

var _filesAttribute2 = _interopRequireDefault(_filesAttribute);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = config => {
    /**
     * File attribute
     * @package webiny-api
     * @return {FileAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.file = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new _fileAttribute2.default(this.name, this, config.entity));
        const attribute = parent.getAttribute(this.name);
        attribute.setStorage(config.storage);
        return attribute;
    };

    /**
     * Files attribute
     * @package webiny-api
     * @return {FilesAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.files = function() {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _filesAttribute2.default(this.name, this, config.entity)
        );
        const attribute = parent.getAttribute(this.name);
        attribute.setStorage(config.storage);
        return attribute;
    };
};
//# sourceMappingURL=registerFileAttributes.js.map
