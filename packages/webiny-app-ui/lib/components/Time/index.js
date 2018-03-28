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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

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

var Time = (function(_Webiny$Ui$FormCompon) {
    (0, _inherits3.default)(Time, _Webiny$Ui$FormCompon);

    function Time(props) {
        (0, _classCallCheck3.default)(this, Time);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Time.__proto__ || Object.getPrototypeOf(Time)).call(this, props)
        );

        _this.valueChanged = false;

        _this.bindMethods("setup,onChange");
        return _this;
    }

    (0, _createClass3.default)(Time, [
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
                    Time.prototype.__proto__ || Object.getPrototypeOf(Time.prototype),
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

                this.element = (0, _jquery2.default)(this.dom);

                var format = this.props.inputFormat || _webinyApp.Webiny.I18n.getTimeFormat();
                format = _webinyApp.Webiny.I18n.convertPhpToJsDateTimeFormat(format);

                this.element
                    .datetimepicker({
                        format: format,
                        stepping: this.props.stepping,
                        keepOpen: false,
                        debug: this.props.debug || false,
                        minDate: this.props.minDate ? new Date(this.props.minDate) : false,
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
                    newValue = _webinyApp.Webiny.I18n.time(
                        newValue,
                        this.props.modelFormat,
                        this.props.inputFormat || _webinyApp.Webiny.I18n.getTimeFormat()
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
                    return _webinyApp.Webiny.I18n.time(
                        this.props.value,
                        this.props.inputFormat,
                        this.props.modelFormat
                    );
                }

                return this.getPlaceholder();
            }
        }
    ]);
    return Time;
})(_webinyApp.Webiny.Ui.FormComponent);

Time.defaultProps = {
    onChange: _noop3.default,
    debug: false,
    disabled: false,
    readOnly: false,
    placeholder: "",
    inputFormat: null,
    modelFormat: "H:i:s",
    stepping: 15,
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
        props.onRef = function(input) {
            _this3.dom = input;
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
};

exports.default = _webinyApp.Webiny.createComponent(Time, {
    modules: ["Icon", "Input", "Webiny/Vendors/DateTimePicker"]
});
//# sourceMappingURL=index.js.map
