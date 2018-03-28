"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (value, params) => {
    if (!value) return;
    value = value + "";

    const regex = new RegExp(
        // eslint-disable-next-line
        /^(https?:\/\/)((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
    );

    const ipRegex = new RegExp(
        // eslint-disable-next-line
        /^(https?:\/\/)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    );

    if (regex.test(value)) {
        if (!params.includes("noIp")) {
            return;
        }

        if (!ipRegex.test(value)) {
            return;
        }
    }

    throw new _validationError2.default("Value must be a valid URL.");
};
//# sourceMappingURL=url.js.map
