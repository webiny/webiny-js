"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _DateTime = require("./DateTime");

var _DateTime2 = _interopRequireDefault(_DateTime);

var _Date = require("./Date");

var _Date2 = _interopRequireDefault(_Date);

var _Time = require("./Time");

var _Time2 = _interopRequireDefault(_Time);

var _Number = require("./Number");

var _Number2 = _interopRequireDefault(_Number);

var _Price = require("./Price");

var _Price2 = _interopRequireDefault(_Price);

var _FileSize = require("./FileSize");

var _FileSize2 = _interopRequireDefault(_FileSize);

var _TimeAgo = require("./TimeAgo");

var _TimeAgo2 = _interopRequireDefault(_TimeAgo);

var _Pluralize = require("./Pluralize");

var _Pluralize2 = _interopRequireDefault(_Pluralize);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// TODO: after `i18n`
exports.default = {
    DateTime: _DateTime2.default,
    Time: _Time2.default,
    Date: _Date2.default,
    FileSize: _FileSize2.default,
    TimeAgo: _TimeAgo2.default,
    Pluralize: _Pluralize2.default,
    Number: _Number2.default,
    Price: _Price2.default
};
//# sourceMappingURL=index.js.map
