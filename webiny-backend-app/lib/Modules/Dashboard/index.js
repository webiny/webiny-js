"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _webinyClient = require("webiny-client");

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Dashboard = require("./Views/Dashboard");

var _Dashboard2 = _interopRequireDefault(_Dashboard);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Dashboard
 */
var Module = (function(_Webiny$App$Module) {
    (0, _inherits3.default)(Module, _Webiny$App$Module);

    function Module() {
        (0, _classCallCheck3.default)(this, Module);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Module.__proto__ || Object.getPrototypeOf(Module)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Module, [
        {
            key: "init",
            value: function init() {
                this.name = "Dashboard";
                var role = "webiny-dashboard";

                this.registerMenus(
                    _react2.default.createElement(_webinyClient.Webiny.Ui.Menu, {
                        order: "0",
                        label: _webinyClient.Webiny.I18n("Dashboard"),
                        route: "Dashboard",
                        icon: "fa-home",
                        role: role
                    })
                );

                this.registerRoutes(
                    new _webinyClient.Webiny.Route(
                        "Dashboard",
                        "/dashboard",
                        _Dashboard2.default,
                        "Dashboard"
                    ).setRole(role)
                );
            }
        }
    ]);
    return Module;
})(_webinyClient.Webiny.App.Module);

exports.default = Module;
//# sourceMappingURL=index.js.map
