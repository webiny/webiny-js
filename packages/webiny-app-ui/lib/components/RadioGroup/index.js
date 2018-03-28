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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _Radio = require("./Radio");

var _Radio2 = _interopRequireDefault(_Radio);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RadioGroup = (function(_React$Component) {
    (0, _inherits3.default)(RadioGroup, _React$Component);

    function RadioGroup(props) {
        (0, _classCallCheck3.default)(this, RadioGroup);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (RadioGroup.__proto__ || Object.getPrototypeOf(RadioGroup)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.renderOptions = _this.renderOptions.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(RadioGroup, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps) {
                return (
                    !(0, _isEqual3.default)(nextProps.options, this.props.options) ||
                    !(0, _isEqual3.default)(nextProps.value, this.props.value)
                );
            }

            /**
             * Render options elements
             *
             * Callback parameter is used when you need to implement a custom render and optionally wrap each option element with custom markup
             *
             * @returns {Array}
             */
        },
        {
            key: "renderOptions",
            value: function renderOptions() {
                var _this2 = this;

                var callback =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return this.props.options.map(function(item, key) {
                    var checked = false;
                    if ((0, _isPlainObject3.default)(_this2.props.value)) {
                        // If value is an object we need to fetch a single value to compare against option id.
                        // `valueKey` should be used for this purpose but we also use `valueAttr` as a fallback
                        // (although `valueAttr` should only be used for generating options, it contains the default identification attribute name)
                        checked =
                            (0, _get3.default)(
                                _this2.props.value,
                                _this2.props.valueKey || _this2.props.valueAttr
                            ) === item.id;
                    } else {
                        checked = _this2.props.value === item.id;
                    }

                    var props = {
                        key: key,
                        label: item.text,
                        disabled: _this2.props.isDisabled(),
                        option: item,
                        optionIndex: key,
                        value: checked,
                        onChange: function onChange(newValue) {
                            _this2.props.onChange(
                                _this2.props.useDataAsValue ? newValue.data : newValue.id,
                                _this2.validate
                            );
                        }
                    };

                    if (_this2.props.renderRadio) {
                        props.render = _this2.props.renderRadio;
                    }

                    if (_this2.props.renderRadioLabel) {
                        props.renderLabel = _this2.props.renderRadioLabel;
                    }

                    var radio = _react2.default.createElement(_Radio2.default, props);

                    if (callback) {
                        return callback(radio, key);
                    }

                    return radio;
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
                    styles = _props.styles,
                    className = _props.className,
                    disabled = _props.disabled;

                return _react2.default.createElement(
                    FormGroup,
                    {
                        className: (0, _classnames2.default)(className, disabled && styles.disabled)
                    },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement("div", { className: "clearfix" }),
                    this.renderOptions(),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return RadioGroup;
})(_react2.default.Component);

RadioGroup.Radio = _Radio2.default;

RadioGroup.defaultProps = {
    renderRadioLabel: null,
    renderRadio: null
};

exports.default = (0, _webinyApp.createComponent)([RadioGroup, _webinyAppUi.OptionComponent], {
    modules: ["FormGroup"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
