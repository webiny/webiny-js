"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _webinyApi = require("webiny-api");

var _imageAttribute = require("./imageAttribute");

var _imageAttribute2 = _interopRequireDefault(_imageAttribute);

var _imagesAttribute = require("./imagesAttribute");

var _imagesAttribute2 = _interopRequireDefault(_imagesAttribute);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = config => {
    /**
     * Image attribute
     * @package webiny-api
     * @return {ImageAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.image = function() {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _imageAttribute2.default(this.name, this, config.entity)
        );
        const attribute = parent.getAttribute(this.name);
        attribute.setProcessor(config.processor);
        attribute.setQuality(config.quality);
        attribute.setStorage(config.storage);
        return attribute;
    };

    /**
     * Images attribute
     * @package webiny-api
     * @return {ImagesAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.images = function() {
        const parent = this.getParentModel();
        parent.setAttribute(
            this.name,
            new _imagesAttribute2.default(this.name, this, config.entity)
        );
        const attribute = parent.getAttribute(this.name);
        attribute.setProcessor(config.processor);
        attribute.setQuality(config.quality);
        attribute.setStorage(config.storage);
        return attribute;
    };
};
//# sourceMappingURL=registerImageAttributes.js.map
