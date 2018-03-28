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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

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

var Button = (function(_React$Component) {
    (0, _inherits3.default)(Button, _React$Component);

    function Button(props) {
        (0, _classCallCheck3.default)(this, Button);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Button.__proto__ || Object.getPrototypeOf(Button)).call(this, props)
        );

        _this.state = {
            enabled: true
        };
        return _this;
    }

    (0, _createClass3.default)(Button, [
        {
            key: "disable",
            value: function disable() {
                this.setState({ enabled: false });
            }
        },
        {
            key: "enable",
            value: function enable() {
                this.setState({ enabled: true });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = (0, _clone3.default)(this.props);
                var Tooltip = props.Tooltip,
                    Icon = props.Icon,
                    styles = props.styles;

                if (props.disabled || !this.state.enabled) {
                    props["disabled"] = true;
                }

                var sizeClasses = {
                    normal: "",
                    large: styles.btnLarge
                    //small: 'btn-sm' // sven: this option doesn't exist in css
                };

                var alignClasses = {
                    normal: "",
                    left: "pull-left",
                    right: "pull-right"
                };

                var typeClasses = {
                    default: styles.btnDefault,
                    primary: styles.btnPrimary,
                    secondary: styles.btnSuccess
                };

                var classes = (0, _classnames2.default)(
                    sizeClasses[props.size],
                    alignClasses[props.align],
                    typeClasses[props.type],
                    props.className
                );

                var icon = this.props.icon
                    ? _react2.default.createElement(Icon, {
                          icon: this.props.icon,
                          className: styles.icon + " " + styles.iconRight
                      })
                    : null;
                var content = props.children || props.label;
                if (icon) {
                    content = _react2.default.createElement("span", null, content);
                }

                var buttonProps = (0, _pick3.default)(props, ["style", "disabled"]);
                buttonProps.onClick = function(e) {
                    return _this2.props.onClick({ event: e });
                };
                (0, _assign3.default)(buttonProps, {
                    type: "button",
                    className: classes,
                    ref: this.props.onRef
                });
                var button = _react2.default.createElement(
                    "button",
                    buttonProps,
                    icon,
                    " ",
                    content
                );

                if (this.props.tooltip) {
                    button = _react2.default.createElement(
                        Tooltip,
                        { target: button, placement: "top" },
                        this.props.tooltip
                    );
                }

                return button;
            }
        }
    ]);
    return Button;
})(_react2.default.Component);

Button.defaultProps = {
    size: "normal",
    type: "default",
    align: "normal",
    icon: null,
    className: null,
    style: null,
    label: null,
    onClick: _noop3.default,
    tooltip: null,
    disabled: false,
    onRef: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(Button, {
    styles: _styles2.default,
    modules: ["Tooltip", "Icon"]
});
//# sourceMappingURL=index.js.map
