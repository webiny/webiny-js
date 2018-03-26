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

var _Views = require("./Views/Views");

var _Views2 = _interopRequireDefault(_Views);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18n
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
                this.name = "I18N";
                var Menu = _webinyClient.Webiny.Ui.Menu;

                this.registerMenus(
                    _react2.default.createElement(
                        Menu,
                        {
                            label: _webinyClient.Webiny.I18n("I18N"),
                            icon: "icon-earth",
                            role: "webiny-i18n-manager"
                        },
                        _react2.default.createElement(
                            Menu,
                            { label: _webinyClient.Webiny.I18n("Texts"), order: 100 },
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Translations"),
                                route: "I18N.Translations.List",
                                order: 100
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Texts"),
                                route: "I18N.Texts.List",
                                order: 101
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Text Groups"),
                                route: "I18N.TextGroups.List",
                                order: 102
                            })
                        ),
                        _react2.default.createElement(Menu, {
                            label: _webinyClient.Webiny.I18n("Locales"),
                            route: "I18N.Locales.List",
                            order: 101
                        })
                    )
                );

                this.registerRoutes(
                    new _webinyClient.Webiny.Route(
                        "I18N.Locales.List",
                        "/i18n/locales",
                        _Views2.default.LocalesList,
                        "I18N - List Locales"
                    ),
                    new _webinyClient.Webiny.Route(
                        "I18N.Texts.List",
                        "/i18n/texts",
                        _Views2.default.TextsList,
                        "I18N - List Texts"
                    ),
                    new _webinyClient.Webiny.Route(
                        "I18N.TextGroups.List",
                        "/i18n/text-groups",
                        _Views2.default.TextGroupsList,
                        "I18N - List Text Groups"
                    ),
                    new _webinyClient.Webiny.Route(
                        "I18N.Translations.List",
                        "/i18n/translations",
                        _Views2.default.TranslationsList,
                        "I18N - List Translations"
                    )
                );
            }
        }
    ]);
    return Module;
})(_webinyClient.Webiny.App.Module);

exports.default = Module;
//# sourceMappingURL=index.js.map
