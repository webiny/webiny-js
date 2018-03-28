"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bcryptjs = require("bcryptjs");

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _webinyModel = require("webiny-model");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = () => {
    return class PasswordAttribute extends _webinyModel.CharAttribute {
        constructor() {
            super();

            this.onSet(value => {
                if (value) {
                    return _bcryptjs2.default.hashSync(value, _bcryptjs2.default.genSaltSync(10));
                }
                return this.value.getCurrent();
            });
        }
    };
};
//# sourceMappingURL=passwordAttribute.js.map
