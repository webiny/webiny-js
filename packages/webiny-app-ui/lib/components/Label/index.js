"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Label = (function(_React$Component) {
    (0, _inherits3.default)(Label, _React$Component);

    function Label() {
        (0, _classCallCheck3.default)(this, Label);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Label.__proto__ || Object.getPrototypeOf(Label)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Label, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    inline = _props.inline,
                    props = (0, _objectWithoutProperties3.default)(_props, ["styles", "inline"]);

                var typeClasses = {
                    default: styles.default,
                    info: styles.info,
                    primary: styles.primary,
                    success: styles.success,
                    warning: styles.warning,
                    error: styles.danger
                };

                var classes = (0, _classnames2.default)(
                    styles.label,
                    typeClasses[props.type],
                    props.className
                );

                var style = {};
                if (inline) {
                    style["float"] = "none";
                }

                return _react2.default.createElement(
                    "span",
                    { className: classes, style: style },
                    props.children
                );
            }
        }
    ]);
    return Label;
})(_react2.default.Component);

Label.defaultProps = {
    inline: false,
    type: "default",
    className: null
};

exports.default = (0, _webinyApp.createComponent)(Label, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
