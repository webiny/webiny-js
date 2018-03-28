"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Date = (function(_React$Component) {
    (0, _inherits3.default)(Date, _React$Component);

    function Date(props) {
        (0, _classCallCheck3.default)(this, Date);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Date.__proto__ || Object.getPrototypeOf(Date)).call(this, props)
        );

        _this.state = {};
        _this.valueChanged = false;
        _this.element = null;

        _this.setup = _this.setup.bind(_this);
        _this.onChange = _this.onChange.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Date, [
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                if (nextProps["disabledBy"]) {
                    return true;
                }

                var omit = ["children", "key", "ref", "onChange"];
                var oldProps = (0, _omit3.default)(this.props, omit);
                var newProps = (0, _omit3.default)(nextProps, omit);

                return (
                    !(0, _isEqual3.default)(newProps, oldProps) ||
                    !(0, _isEqual3.default)(nextState, this.state)
                );
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate(prevProps, prevState) {
                if (prevState.isValid !== this.state.isValid) {
                    this.input.setState({
                        isValid: this.state.isValid,
                        validationMessage: this.state.validationMessage
                    });
                }
            }
        },
        {
            key: "setup",
            value: function setup() {
                var _this2 = this;

                var format = this.props.inputFormat;

                this.element
                    .datetimepicker({
                        format: format,
                        stepping: this.props.stepping,
                        keepOpen: false,
                        debug: this.props.debug || false,
                        minDate: this.props.minDate ? new Date(this.props.minDate) : false,
                        viewMode: this.props.viewMode,
                        widgetPositioning: {
                            horizontal: this.props.positionHorizontal,
                            vertical: this.props.positionVertical
                        }
                    })
                    .on("dp.hide", function(e) {
                        if (_this2.valueChanged) {
                            _this2.onChange(e.target.value);
                        }
                        _this2.valueChanged = false;
                    })
                    .on("dp.change", function() {
                        _this2.valueChanged = true;
                    });
            }
        },
        {
            key: "onChange",
            value: function onChange(newValue) {
                if (newValue) {
                    var modelFormat = this.props.withTimezone
                        ? "Y-m-dTH:i:sO"
                        : this.props.modelFormat;
                    newValue = Webiny.I18n.datetime(
                        newValue,
                        modelFormat,
                        this.props.inputFormat || Webiny.I18n.getDateFormat()
                    );
                }

                if (newValue !== this.props.value) {
                    this.props.onChange(newValue, this.validate);
                }
            }
        },
        {
            key: "renderPreview",
            value: function renderPreview() {
                if (!(0, _isEmpty3.default)(this.props.value)) {
                    return Webiny.I18n.date(
                        this.props.value,
                        this.props.inputFormat,
                        this.props.modelFormat
                    );
                }

                return this.getPlaceholder();
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var omitProps = [
                    "attachToForm",
                    "attachValidators",
                    "detachFromForm",
                    "validateInput",
                    "form",
                    "renderer",
                    "name",
                    "onChange"
                ];
                var props = (0, _omit3.default)(this.props, omitProps);
                var Input = props.Input,
                    Icon = props.Icon;

                props.value = this.renderPreview();
                props.addonRight = _react2.default.createElement(Icon, { icon: "icon-calendar" });
                props.onRef = function(element) {
                    _this3.element = element;
                    _this3.setup();
                };
                return _react2.default.createElement(
                    Input,
                    (0, _extends3.default)(
                        {
                            ref: function ref(_ref) {
                                return (_this3.input = _ref);
                            }
                        },
                        props
                    )
                );
            }
        }
    ]);
    return Date;
})(_react2.default.Component);

Date.defaultProps = {
    debug: false,
    inputFormat: null,
    modelFormat: "Y-m-d",
    withTimezone: false,
    positionHorizontal: "auto",
    positionVertical: "bottom",
    viewMode: "days"
};

exports.default = (0, _webinyApp.createComponent)([Date, _webinyAppUi.FormComponent], {
    modules: ["Icon", "Input", "Vendors/DateTimePicker"]
});
//# sourceMappingURL=index.js.map
