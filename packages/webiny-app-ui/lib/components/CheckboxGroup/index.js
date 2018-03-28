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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CheckboxGroup = (function(_React$Component) {
    (0, _inherits3.default)(CheckboxGroup, _React$Component);

    function CheckboxGroup(props) {
        (0, _classCallCheck3.default)(this, CheckboxGroup);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (CheckboxGroup.__proto__ || Object.getPrototypeOf(CheckboxGroup)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.renderOptions = _this.renderOptions.bind(_this);
        _this.onChange = _this.onChange.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(CheckboxGroup, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "onChange",
            value: function onChange(key, newValue) {
                var _this2 = this;

                var option = this.props.options[key];
                var newState = this.props.value || [];
                if (newValue) {
                    newValue = this.props.formatOptionValue({
                        value: this.props.useDataAsValue ? option.data : option.id
                    });
                    newState.push(newValue);
                } else {
                    var currentIndex = (0, _findIndex3.default)(newState, function(opt) {
                        var optValue = _this2.props.valueKey
                            ? (0, _get3.default)(opt, _this2.props.valueKey)
                            : opt;
                        return optValue === option.id;
                    });

                    newState.splice(currentIndex, 1);
                }
                this.props.onChange(newState, this.validate);
            }

            /**
             * Create options elements
             *
             * Callback parameter is used when you need to implement a custom renderer and optionally wrap each option element with custom markup
             *
             * @returns {Array}
             */
        },
        {
            key: "renderOptions",
            value: function renderOptions() {
                var _this3 = this;

                var callback =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var Checkbox = this.props.Checkbox;

                return this.props.options.map(function(item, key) {
                    var checked = (0, _find3.default)(_this3.props.value, function(opt) {
                        if ((0, _isPlainObject3.default)(opt)) {
                            return (0, _get3.default)(opt, _this3.props.valueKey) === item.id;
                        }
                        return opt === item.id;
                    });

                    var props = {
                        key: key, // React key
                        label: item.text,
                        disabled: _this3.props.isDisabled(),
                        value: checked, // true/false
                        onChange: _this3.onChange,
                        option: item,
                        optionIndex: key
                    };

                    if ((0, _isFunction3.default)(_this3.props.renderCheckbox)) {
                        props.render = _this3.props.renderCheckbox;
                    }

                    if ((0, _isFunction3.default)(_this3.props.renderCheckboxLabel)) {
                        props.labelRenderer = _this3.props.renderCheckboxLabel;
                    }
                    var checkbox = _react2.default.createElement(Checkbox, props);

                    if (callback) {
                        return callback(checkbox, key);
                    }

                    return checkbox;
                });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement("div", { className: "clearfix" }),
                    _react2.default.createElement(
                        "div",
                        { className: "inputGroup " + (this.props.disabled && styles.disabled) },
                        this.renderOptions()
                    ),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return CheckboxGroup;
})(_react2.default.Component);

CheckboxGroup.defaultProps = {
    renderCheckbox: null,
    renderCheckboxLabel: null,
    formatOptionValue: function formatOptionValue(_ref) {
        var value = _ref.value;
        return value;
    }
};

exports.default = (0, _webinyApp.createComponent)([CheckboxGroup, _webinyAppUi.OptionComponent], {
    modules: ["Checkbox", "FormGroup"],
    formComponent: true,
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
