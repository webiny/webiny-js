"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _passwordAttribute = require("./passwordAttribute");

var _passwordAttribute2 = _interopRequireDefault(_passwordAttribute);

var _identityAttribute = require("./identityAttribute");

var _identityAttribute2 = _interopRequireDefault(_identityAttribute);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = authentication => {
    const PasswordAttribute = (0, _passwordAttribute2.default)();
    const IdentityAttribute = (0, _identityAttribute2.default)(authentication);

    /**
     * Password attribute
     * @package webiny-api-security
     * @return {UserAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.password = function() {
        const parent = this.getParentModel();
        parent.setAttribute(this.name, new PasswordAttribute(this.name, this));
        return parent.getAttribute(this.name);
    };

    /**
     * Identity attribute. Used to store a reference to an Identity.
     * @package webiny-api-security
     * @return {IdentityAttribute}
     */
    _webinyEntity.EntityAttributesContainer.prototype.identity = function(options) {
        const model = this.getParentModel();
        model.setAttribute(this.name, new IdentityAttribute(this.name, this, options));
        return model.getAttribute(this.name);
    };
};
//# sourceMappingURL=registerAttributes.js.map
