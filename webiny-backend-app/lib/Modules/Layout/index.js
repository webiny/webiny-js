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

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Layout = (function(_Webiny$App$Module) {
    (0, _inherits3.default)(Layout, _Webiny$App$Module);

    function Layout() {
        (0, _classCallCheck3.default)(this, Layout);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Layout.__proto__ || Object.getPrototypeOf(Layout)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Layout, [
        {
            key: "init",
            value: function init() {
                this.name = "Layout";
                this.registerDefaultComponents({ Footer: _Footer2.default });
            }
        }
    ]);
    return Layout;
})(_webinyClient.Webiny.App.Module);

exports.default = Layout;
//# sourceMappingURL=index.js.map
