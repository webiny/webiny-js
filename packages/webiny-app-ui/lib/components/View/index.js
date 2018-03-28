"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _View = require("./View");

var _View2 = _interopRequireDefault(_View);

var _FormView = require("./FormView");

var _FormView2 = _interopRequireDefault(_FormView);

var _ListView = require("./ListView");

var _ListView2 = _interopRequireDefault(_ListView);

var _DashboardView = require("./DashboardView");

var _DashboardView2 = _interopRequireDefault(_DashboardView);

var _ChartBlock = require("./ChartBlock");

var _ChartBlock2 = _interopRequireDefault(_ChartBlock);

var _InfoBlock = require("./InfoBlock");

var _InfoBlock2 = _interopRequireDefault(_InfoBlock);

var _Body = require("./Body");

var _Body2 = _interopRequireDefault(_Body);

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

var _HeaderCenter = require("./DashboardComponents/HeaderCenter");

var _HeaderCenter2 = _interopRequireDefault(_HeaderCenter);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

_View2.default.Form = _FormView2.default;
_View2.default.List = _ListView2.default;
_View2.default.Dashboard = _DashboardView2.default;
_View2.default.Header = _Header2.default;
_View2.default.Header.Center = _HeaderCenter2.default;
_View2.default.Body = _Body2.default;
_View2.default.Footer = _Footer2.default;

_View2.default.ChartBlock = _ChartBlock2.default;
_View2.default.InfoBlock = _InfoBlock2.default;

exports.default = _View2.default;
//# sourceMappingURL=index.js.map
