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

var _FormComponent = require("./../Form/FormComponent");

var _FormComponent2 = _interopRequireDefault(_FormComponent);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Input = (function(_React$Component) {
    (0, _inherits3.default)(Input, _React$Component);

    function Input(props) {
        (0, _classCallCheck3.default)(this, Input);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.focus = _this.focus.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Input, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "onKeyDown",
            value: function onKeyDown(_ref) {
                var event = _ref.event;

                if (event.metaKey || event.ctrlKey) {
                    return;
                }

                switch (event.key) {
                    case "Enter":
                        if (this.props.onEnter && this.props.onEnter !== _noop3.default) {
                            event.preventDefault();
                            this.props.onEnter({ event: event, component: this });
                        }
                        break;
                    default:
                        break;
                }
            }
        },
        {
            key: "focus",
            value: function focus() {
                this.dom.focus();
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    DelayedOnChange = _props.DelayedOnChange,
                    Icon = _props.Icon,
                    styles = _props.styles,
                    FormGroup = _props.FormGroup;

                var props = {
                    "data-on-enter": this.props.onEnter !== _noop3.default,
                    onBlur: this.props.validate ? this.props.validate : this.props.onBlur,
                    disabled: this.props.isDisabled(),
                    readOnly: this.props.readOnly,
                    type: this.props.type,
                    className: styles.input,
                    value: this.props.value || "",
                    placeholder: this.props.placeholder,
                    onKeyUp: function onKeyUp(event) {
                        return _this2.props.onKeyUp({ event: event, component: _this2 });
                    },
                    onKeyDown: function onKeyDown(event) {
                        return (_this2.props.onKeyDown !== _noop3.default
                            ? _this2.props.onKeyDown
                            : _this2.onKeyDown.bind(_this2))({
                            event: event,
                            component: _this2
                        });
                    },
                    onChange: this.props.onChange,
                    autoFocus: this.props.autoFocus,
                    ref: function ref(_ref2) {
                        _this2.dom = _ref2;
                        _this2.props.onRef(_ref2);
                    }
                };

                var showValidationIcon = true;
                var addonLeft = "";
                if (this.props.addonLeft) {
                    addonLeft = _react2.default.createElement(
                        "span",
                        { className: styles.addon },
                        this.props.addonLeft
                    );
                    showValidationIcon = false;
                }

                var addonRight = "";
                if (this.props.addonRight) {
                    addonRight = _react2.default.createElement(
                        "span",
                        { className: styles.addon },
                        this.props.addonRight
                    );
                    showValidationIcon = false;
                }

                var wrapperClassName = this.props.wrapperClassName + " inputGroup";
                var iconLeft = "";
                if (this.props.iconLeft) {
                    wrapperClassName += " " + styles.iconLeft;
                    iconLeft = _react2.default.createElement(Icon, { icon: this.props.iconLeft });
                }

                var iconRight = "";
                if (this.props.iconRight) {
                    wrapperClassName += " " + styles.iconRight;
                    iconRight = _react2.default.createElement(Icon, { icon: this.props.iconRight });
                }

                return _react2.default.createElement(
                    FormGroup,
                    {
                        ref: function ref(_ref3) {
                            return (_this2.ref = _ref3);
                        },
                        valid: this.state.isValid,
                        className: this.props.className
                    },
                    this.props.renderLabel.call(this),
                    this.props.renderInfo.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: wrapperClassName },
                        iconLeft,
                        addonLeft,
                        _react2.default.createElement(
                            DelayedOnChange,
                            { delay: this.props.delay },
                            _react2.default.createElement("input", props)
                        ),
                        addonRight,
                        iconRight,
                        showValidationIcon && this.props.renderValidationIcon.call(this)
                    ),
                    this.props.renderDescription.call(this),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Input;
})(_react2.default.Component);

Input.defaultProps = {
    delay: 400,
    onEnter: _noop3.default, // NOTE: only works if inside a Form
    onKeyDown: _noop3.default,
    onKeyUp: _noop3.default,
    onRef: _noop3.default,
    type: "text",
    autoFocus: null,
    addonLeft: null,
    addonRight: null,
    iconLeft: null,
    iconRight: null,
    wrapperClassName: "",
    renderValidationIcon: function renderValidationIcon() {
        if (!this.props.showValidationIcon || this.state.isValid === null) {
            return null;
        }

        var FormGroup = this.props.FormGroup;

        if (this.state.isValid === true) {
            return _react2.default.createElement(FormGroup.ValidationIcon, null);
        }
        return _react2.default.createElement(FormGroup.ValidationIcon, { error: true });
    }
};

exports.default = (0, _webinyApp.createComponent)([Input, _FormComponent2.default], {
    formComponent: true,
    modules: ["DelayedOnChange", "Icon", "FormGroup"],
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
