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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _Container = require("./Container");

var _Container2 = _interopRequireDefault(_Container);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Alert = (function(_React$Component) {
    (0, _inherits3.default)(Alert, _React$Component);

    function Alert() {
        (0, _classCallCheck3.default)(this, Alert);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Alert.__proto__ || Object.getPrototypeOf(Alert)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Alert, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    type = _props.type,
                    Icon = _props.Icon,
                    onClose = _props.onClose;

                var typeClasses = {
                    info: styles.alertInfo,
                    success: styles.alertSuccess,
                    warning: styles.alertWarning,
                    error: styles.alertDanger,
                    danger: styles.alertDanger
                };

                var iconClasses = {
                    info: "icon-info-circle",
                    success: "icon-check-circle-o",
                    warning: "icon-exclamation-circle",
                    error: "icon-cancel",
                    danger: "icon-cancel"
                };

                var classes = (0, _classnames2.default)(typeClasses[type], this.props.className);

                var icon = null;
                if (this.props.icon) {
                    icon = _react2.default.createElement(Icon, { icon: this.props.icon });
                } else {
                    icon = _react2.default.createElement(Icon, { icon: iconClasses[type] });
                }

                var title = this.props.title
                    ? _react2.default.createElement("strong", null, this.props.title, ":")
                    : null;

                return _react2.default.createElement(
                    _Container2.default,
                    { onClose: onClose },
                    function(close) {
                        return _react2.default.createElement(
                            "div",
                            { className: classes },
                            icon,
                            _this2.props.close &&
                                _react2.default.createElement(
                                    "button",
                                    { type: "button", className: styles.close, onClick: close },
                                    _react2.default.createElement(
                                        "span",
                                        { "aria-hidden": "true" },
                                        "\xD7"
                                    )
                                ),
                            title,
                            " ",
                            _this2.props.children
                        );
                    }
                );
            }
        }
    ]);
    return Alert;
})(_react2.default.Component);

Alert.defaultProps = {
    type: "info",
    icon: null,
    title: null,
    close: false,
    onClose: _noop3.default,
    className: null
};

exports.default = (0, _webinyApp.createComponent)(Alert, {
    styles: _styles2.default,
    modules: ["Icon"]
});
//# sourceMappingURL=index.js.map
