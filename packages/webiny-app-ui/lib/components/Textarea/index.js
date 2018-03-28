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

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Textarea = (function(_React$Component) {
    (0, _inherits3.default)(Textarea, _React$Component);

    function Textarea(props) {
        (0, _classCallCheck3.default)(this, Textarea);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Textarea.__proto__ || Object.getPrototypeOf(Textarea)).call(this)
        );

        _this.state = Object.assign({}, props.initialState);
        return _this;
    }

    (0, _createClass3.default)(Textarea, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var props = {
                    onBlur: this.validate,
                    disabled: this.props.isDisabled(),
                    className: (0, _classnames2.default)("inputGroup", styles.textarea),
                    value: this.props.value || "",
                    placeholder: this.props.placeholder,
                    style: this.props.style,
                    onChange: this.props.onChange,
                    onKeyDown: this.props.onKeyDown,
                    onKeyUp: this.props.onKeyUp
                };

                var DelayedOnChange = this.props.DelayedOnChange;

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement(
                        DelayedOnChange,
                        { delay: this.props.delay },
                        _react2.default.createElement("textarea", props)
                    ),
                    this.props.renderDescription.call(this),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Textarea;
})(_react2.default.Component);

Textarea.defaultProps = {
    delay: 400
};

exports.default = (0, _webinyApp.createComponent)([Textarea, _webinyAppUi.FormComponent], {
    modules: ["DelayedOnChange", "FormGroup"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
