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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Page = (function(_React$Component) {
    (0, _inherits3.default)(Page, _React$Component);

    function Page() {
        (0, _classCallCheck3.default)(this, Page);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Page.__proto__ || Object.getPrototypeOf(Page)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Page, [
        {
            key: "render",
            value: function render() {
                var page = this.props.page;

                return _react2.default.createElement(
                    "div",
                    { style: { width: 400 } },
                    _react2.default.createElement("h2", null, page.title),
                    this.props.children
                );
            }
        }
    ]);
    return Page;
})(_react2.default.Component);

exports.default = Page;
//# sourceMappingURL=Page.js.map
