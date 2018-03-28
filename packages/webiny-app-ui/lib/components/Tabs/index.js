"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Tabs = require("./Tabs");

var _Tabs2 = _interopRequireDefault(_Tabs);

var _Tab = require("./Tab");

var _Tab2 = _interopRequireDefault(_Tab);

var _TabHeader = require("./TabHeader");

var _TabHeader2 = _interopRequireDefault(_TabHeader);

var _TabContent = require("./TabContent");

var _TabContent2 = _interopRequireDefault(_TabContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

_Tabs2.default.Tab = _Tab2.default;
_Tab2.default.Header = _TabHeader2.default;
_Tab2.default.Content = _TabContent2.default;

exports.default = _Tabs2.default;
//# sourceMappingURL=index.js.map
