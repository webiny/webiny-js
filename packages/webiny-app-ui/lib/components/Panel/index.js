"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _Body = require("./Body");

var _Body2 = _interopRequireDefault(_Body);

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

var _Panel = require("./Panel");

var _Panel2 = _interopRequireDefault(_Panel);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

(0, _assign3.default)(_Panel2.default, {
    Header: _Header2.default,
    Body: _Body2.default,
    Footer: _Footer2.default
});

exports.default = _Panel2.default;
//# sourceMappingURL=index.js.map
