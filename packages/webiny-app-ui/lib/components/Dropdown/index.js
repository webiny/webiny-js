"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _Dropdown = require("./Dropdown");

var _Dropdown2 = _interopRequireDefault(_Dropdown);

var _Divider = require("./Divider");

var _Divider2 = _interopRequireDefault(_Divider);

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Link = require("./Link");

var _Link2 = _interopRequireDefault(_Link);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

(0, _assign3.default)(_Dropdown2.default, {
    Header: _Header2.default,
    Divider: _Divider2.default,
    Link: _Link2.default
});

exports.default = _Dropdown2.default;
//# sourceMappingURL=index.js.map
