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

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Icon = (function(_React$Component) {
    (0, _inherits3.default)(Icon, _React$Component);

    function Icon() {
        (0, _classCallCheck3.default)(this, Icon);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Icon.__proto__ || Object.getPrototypeOf(Icon)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Icon, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    icon = _props.icon,
                    className = _props.className,
                    element = _props.element,
                    onClick = _props.onClick;

                var iconSet = "icon";
                if ((0, _includes3.default)(icon, "fa-")) {
                    iconSet = "fa icon";
                }

                var typeClasses = {
                    default: "",
                    danger: styles.danger,
                    success: styles.success,
                    info: styles.info,
                    warning: styles.warning
                };

                var sizeClasses = {
                    default: "",
                    "2x": styles.size2x,
                    "3x": styles.size3x,
                    "4x": styles.size4x
                };

                var classes = (0, _classnames2.default)(
                    iconSet,
                    icon,
                    className,
                    sizeClasses[this.props.size],
                    typeClasses[this.props.type]
                );

                return _react2.default.createElement(element, {
                    className: classes,
                    onClick: onClick
                });
            }
        }
    ]);
    return Icon;
})(_react2.default.Component);

Icon.defaultProps = {
    icon: null,
    className: null,
    element: "span", // span || i
    type: "default",
    size: "default"
};

exports.default = (0, _webinyApp.createComponent)(Icon, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
