"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (resolve = {}) => {
    return _lodash2.default.merge(
        {},
        {
            alias: {}
        },
        resolve
    );
};
//# sourceMappingURL=resolve.js.map
