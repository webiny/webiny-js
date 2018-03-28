"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _CountModifier = require("./CountModifier");

var _CountModifier2 = _interopRequireDefault(_CountModifier);

var _GenderModifier = require("./GenderModifier");

var _GenderModifier2 = _interopRequireDefault(_GenderModifier);

var _IfModifier = require("./IfModifier");

var _IfModifier2 = _interopRequireDefault(_IfModifier);

var _PluralModifier = require("./PluralModifier");

var _PluralModifier2 = _interopRequireDefault(_PluralModifier);

var _DateModifier = require("./DateModifier");

var _DateModifier2 = _interopRequireDefault(_DateModifier);

var _DateTimeModifier = require("./DateTimeModifier");

var _DateTimeModifier2 = _interopRequireDefault(_DateTimeModifier);

var _TimeModifier = require("./TimeModifier");

var _TimeModifier2 = _interopRequireDefault(_TimeModifier);

var _NumberModifier = require("./NumberModifier");

var _NumberModifier2 = _interopRequireDefault(_NumberModifier);

var _PriceModifier = require("./PriceModifier");

var _PriceModifier2 = _interopRequireDefault(_PriceModifier);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = [
    new _CountModifier2.default(),
    new _GenderModifier2.default(),
    new _IfModifier2.default(),
    new _PluralModifier2.default(),
    new _DateModifier2.default(),
    new _DateTimeModifier2.default(),
    new _TimeModifier2.default(),
    new _NumberModifier2.default(),
    new _PriceModifier2.default()
]; // Built-in modifiers
//# sourceMappingURL=index.js.map
