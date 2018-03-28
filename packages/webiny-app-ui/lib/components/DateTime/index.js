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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

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

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var DateTime = (function(_Webiny$Ui$FormCompon) {
    (0, _inherits3.default)(DateTime, _Webiny$Ui$FormCompon);

    function DateTime(props) {
        (0, _classCallCheck3.default)(this, DateTime);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DateTime.__proto__ || Object.getPrototypeOf(DateTime)).call(this, props)
        );

        _this.valueChanged = false;

        _this.bindMethods("setup,onChange");
        return _this;
    }

    (0, _createClass3.default)(DateTime, [
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
                (0, _get3.default)(
                    DateTime.prototype.__proto__ || Object.getPrototypeOf(DateTime.prototype),
                    "componentDidUpdate",
                    this
                ).call(this);
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

                this.element = (0, _jquery2.default)(this.input);

                var format = this.props.inputFormat || _webinyApp.Webiny.I18n.getDatetimeFormat();
                format = _webinyApp.Webiny.I18n.convertPhpToJsDateTimeFormat(format);

                this.element
                    .datetimepicker({
                        format: format,
                        stepping: this.props.stepping,
                        keepOpen: false,
                        debug: this.props.debug || false,
                        minDate: this.props.minDate ? new Date(this.props.minDate) : false,
                        viewMode: this.props.viewMode,
                        widgetPositioning: {
                            horizontal: this.props.positionHorizontal || "auto",
                            vertical: this.props.positionVertical || "bottom"
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
                    newValue = _webinyApp.Webiny.I18n.datetime(
                        newValue,
                        this.props.modelFormat,
                        this.props.inputFormat || _webinyApp.Webiny.I18n.getDatetimeFormat()
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
                    return _webinyApp.Webiny.I18n.datetime(
                        this.props.value,
                        this.props.inputFormat,
                        this.props.modelFormat
                    );
                }

                return this.getPlaceholder();
            }
        }
    ]);
    return DateTime;
})(_webinyApp.Webiny.Ui.FormComponent);

DateTime.defaultProps = _webinyApp.Webiny.Ui.FormComponent.extendProps({
    debug: false,
    inputFormat: null,
    modelFormat: "Y-m-d H:i:s",
    positionHorizontal: "auto",
    positionVertical: "bottom",
    viewMode: "days",
    renderer: function renderer() {
        var _this3 = this;

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
        props.onRef = function(ref) {
            return (_this3.input = ref);
        };
        props.onComponentDidMount = function(input) {
            _this3.input = input;
            _this3.setup();
        };

        return _react2.default.createElement(Input, props);
    }
});

exports.default = _webinyApp.Webiny.createComponent(DateTime, {
    modules: ["Icon", "Input", "Webiny/Vendors/DateTimePicker"]
});
//# sourceMappingURL=index.js.map
