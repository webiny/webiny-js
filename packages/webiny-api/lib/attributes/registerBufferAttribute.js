"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _bufferAttribute = require("./bufferAttribute");

var _bufferAttribute2 = _interopRequireDefault(_bufferAttribute);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = () => {
    /**
     * Buffer attribute
     * @package webiny-api
     * @return {BufferAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.buffer = function(encoding) {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new _bufferAttribute2.default(this.name, encoding));
        return parent.getAttribute(this.name);
    };
};
//# sourceMappingURL=registerBufferAttribute.js.map
