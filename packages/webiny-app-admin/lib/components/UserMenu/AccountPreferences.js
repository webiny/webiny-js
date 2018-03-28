"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Account preferences"],
        ["Account preferences"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Set your account and user preferences"],
        ["Set your account and user preferences"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.Layout.UserMenu.AccountPreferencesMenu");
var AccountPreferencesMenu = function AccountPreferencesMenu(props) {
    var Link = props.Link;

    return _react2.default.createElement(
        "user-menu-item",
        null,
        _react2.default.createElement(Link, { route: "Me.Account" }, t(_templateObject)),
        _react2.default.createElement("span", null, t(_templateObject2))
    );
};

exports.default = (0, _webinyApp.createComponent)(AccountPreferencesMenu, { modules: ["Link"] });
//# sourceMappingURL=AccountPreferences.js.map
