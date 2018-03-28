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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _trimStart2 = require("lodash/trimStart");

var _trimStart3 = _interopRequireDefault(_trimStart2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _FormGroup = require("./../FormGroup");

var _FormGroup2 = _interopRequireDefault(_FormGroup);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var FormComponent = (function(_React$Component) {
    (0, _inherits3.default)(FormComponent, _React$Component);

    function FormComponent() {
        (0, _classCallCheck3.default)(this, FormComponent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (FormComponent.__proto__ || Object.getPrototypeOf(FormComponent)).call(this)
        );

        _this.component = null;
        return _this;
    }

    (0, _createClass3.default)(FormComponent, [
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                if (this.props.detachFromForm && this.component) {
                    this.props.detachFromForm(this.component);
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (
                    !(0, _isEqual3.default)(props.validators, this.props.validators) &&
                    this.props.attachValidators
                ) {
                    this.props.attachValidators(props);
                    if (this.component.state.isValid === false) {
                        this.validate.call(this);
                    }
                }
            }
        },
        {
            key: "isDisabled",
            value: function isDisabled() {
                var disabledBy = this.props.disabledBy;
                if ((0, _isFunction3.default)(disabledBy)) {
                    return disabledBy({ model: this.props.form.getModel() });
                }

                if ((0, _isString3.default)(disabledBy)) {
                    var falsy = disabledBy.startsWith("!");
                    disabledBy = (0, _trimStart3.default)(disabledBy, "!");
                    var value = !!this.props.form.getModel(disabledBy);
                    return falsy ? value === false : value === true;
                }

                return this.props.disabled;
            }

            /**
             * Validate component.
             * `this` is bound to the component instance.
             * @returns {*}
             */
        },
        {
            key: "validate",
            value: function validate(validateInput) {
                var _this2 = this;

                if (validateInput) {
                    return validateInput(this).then(function(validationResult) {
                        if (_this2.props.onBlur) {
                            _this2.props.onBlur.call(null, validationResult, _this2);
                        }
                        return validationResult;
                    });
                }
                return Promise.resolve(true);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var $this = this;
                var props = Object.assign({}, this.props);
                return _react2.default.cloneElement(
                    this.props.children,
                    Object.assign(
                        {},
                        (0, _omit3.default)(props, [
                            "children",
                            "validateInput",
                            "detachFromForm",
                            "attachValidators"
                        ]),
                        {
                            isDisabled: function isDisabled() {
                                return _this3.isDisabled();
                            },
                            // a generic validation function
                            validate: function validate() {
                                return _this3.validate.call(
                                    _this3.component,
                                    $this.props.validateInput
                                );
                            },
                            attachToForm: function attachToForm(instance) {
                                $this.component = instance;
                                props.attachToForm && props.attachToForm(instance);
                            },

                            initialState: {
                                isValid: null,
                                validationMessage: null,
                                validationResults: {}
                            }
                        }
                    )
                );
            }
        }
    ]);
    return FormComponent;
})(_react2.default.Component);

FormComponent.defaultProps = {
    name: null,
    disabled: false,
    disabledBy: null,
    label: null,
    placeholder: null,
    info: null,
    description: null,
    readOnly: false,
    form: null,
    defaultValidate: null,
    value: null,
    validators: null,
    onChange: _noop3.default,
    showValidationMessage: true,
    tooltip: null,
    formatValue: null,
    renderLabel: function renderLabel() {
        var label = null;
        if (this.props.label) {
            var required = null;
            if (this.props.validators && this.props.validators.indexOf("required") > -1) {
                required = _react2.default.createElement(_FormGroup2.default.Required, null);
            }

            label = _react2.default.createElement(
                _FormGroup2.default.Label,
                { tooltip: this.props.tooltip },
                this.props.label,
                " ",
                required
            );
        }

        return label;
    },
    renderValidationMessage: function renderValidationMessage() {
        var success = false;
        if (this.state.isValid === true || this.state.isValid === null) {
            success = true;
        }

        if (!this.props.showValidationMessage) {
            return null;
        }

        !this.props.name && console.log(this.props);

        return _react2.default.createElement(
            _FormGroup2.default.ValidationMessage,
            { show: !success },
            this.state.validationMessage
        );
    },
    renderInfo: function renderInfo() {
        var info = this.props.info;
        if ((0, _isFunction3.default)(info)) {
            info = info(this);
        }

        if (!info) {
            return null;
        }

        return _react2.default.createElement(_FormGroup2.default.InfoMessage, null, info);
    },
    renderDescription: function renderDescription() {
        var description = this.props.description;
        if ((0, _isFunction3.default)(description)) {
            description = description(this);
        }

        if (!description) {
            return null;
        }

        return _react2.default.createElement(
            _FormGroup2.default.DescriptionMessage,
            null,
            description
        );
    }
};

exports.default = FormComponent;
//# sourceMappingURL=FormComponent.js.map
