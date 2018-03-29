"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Log out"], ["Log out"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.Layout.UserMenu.Logout");
var Logout = function Logout(props) {
    return _react2.default.createElement(
        "div",
        { className: "drop-footer" },
        _react2.default.createElement(
            "a",
            { href: "javascript:void(0);", className: "logout", onClick: props.logout },
            _react2.default.createElement("span", { className: "icon-sign-out icon-bell icon" }),
            _react2.default.createElement("span", null, t(_templateObject))
        )
    );
};

exports.default = (0, _webinyApp.createComponent)(Logout);
//# sourceMappingURL=Logout.js.map
