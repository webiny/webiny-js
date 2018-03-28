"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _Form = require("./Form");

var _Form2 = _interopRequireDefault(_Form);

var _Error = require("./Error");

var _Error2 = _interopRequireDefault(_Error);

var _Loader = require("./Loader");

var _Loader2 = _interopRequireDefault(_Loader);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

(0, _assign3.default)(_Form2.default, {
    Error: _Error2.default,
    Loader: _Loader2.default
});

exports.default = _Form2.default;
//# sourceMappingURL=index.js.map
