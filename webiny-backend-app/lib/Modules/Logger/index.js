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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _Views = require("./Views/Views");

var _Views2 = _interopRequireDefault(_Views);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Logger
 */
var Logger = (function(_Webiny$App$Module) {
    (0, _inherits3.default)(Logger, _Webiny$App$Module);

    function Logger() {
        (0, _classCallCheck3.default)(this, Logger);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Logger.__proto__ || Object.getPrototypeOf(Logger)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Logger, [
        {
            key: "init",
            value: function init() {
                this.name = "Logger";
                var Menu = _webinyClient.Webiny.Ui.Menu;
                var role = "webiny-logger-manager";

                this.registerMenus(
                    _react2.default.createElement(
                        Menu,
                        { label: _webinyClient.Webiny.I18n("System"), icon: "icon-tools" },
                        _react2.default.createElement(Menu, {
                            label: _webinyClient.Webiny.I18n("Error Logger"),
                            route: "Logger.ListErrors",
                            role: role
                        })
                    )
                );

                this.registerRoutes(
                    new _webinyClient.Webiny.Route(
                        "Logger.ListErrors",
                        "/logger/list",
                        _Views2.default.Main,
                        "Logger - List Errors"
                    ).setRole(role)
                );
            }
        }
    ]);
    return Logger;
})(_webinyClient.Webiny.App.Module);

exports.default = Logger;
//# sourceMappingURL=index.js.map
