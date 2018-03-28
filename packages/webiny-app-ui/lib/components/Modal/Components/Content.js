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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Content = (function(_React$Component) {
    (0, _inherits3.default)(Content, _React$Component);

    function Content() {
        (0, _classCallCheck3.default)(this, Content);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Content.__proto__ || Object.getPrototypeOf(Content)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Content, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var styles = this.props.styles;

                return _react2.default.createElement(
                    "div",
                    { className: (0, _classnames2.default)(styles.content, this.props.className) },
                    this.props.children
                );
            }
        }
    ]);
    return Content;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Content, { styles: _styles2.default });
//# sourceMappingURL=Content.js.map
