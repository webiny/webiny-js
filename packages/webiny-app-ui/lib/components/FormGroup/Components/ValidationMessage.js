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

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ValidationMessage = (function(_React$Component) {
    (0, _inherits3.default)(ValidationMessage, _React$Component);

    function ValidationMessage() {
        (0, _classCallCheck3.default)(this, ValidationMessage);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ValidationMessage.__proto__ || Object.getPrototypeOf(ValidationMessage)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ValidationMessage, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Animate = _props.Animate,
                    children = _props.children,
                    show = _props.show;

                var css = show ? _styles2.default.validationMessageError : null;

                return _react2.default.createElement(
                    Animate,
                    {
                        trigger: show,
                        hide: this.props.hideValidationAnimation,
                        show: this.props.showValidationAnimation,
                        className: _styles2.default.validationMessageHolder
                    },
                    _react2.default.createElement(
                        "span",
                        {
                            className: (0, _classnames2.default)(
                                _styles2.default.validationMessage,
                                css
                            )
                        },
                        children
                    )
                );
            }
        }
    ]);
    return ValidationMessage;
})(_react2.default.Component);

ValidationMessage.defaultProps = {
    show: false,
    hideValidationAnimation: { translateY: 0, opacity: 0, duration: 225 },
    showValidationAnimation: { translateY: 50, opacity: 1, duration: 225 }
};

exports.default = (0, _webinyApp.createComponent)(ValidationMessage, {
    modules: ["Animate"],
    styles: _styles2.default
});
//# sourceMappingURL=ValidationMessage.js.map
