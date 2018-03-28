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

var _get3 = require("babel-runtime/helpers/get");

var _get4 = _interopRequireDefault(_get3);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _get5 = require("lodash/get");

var _get6 = _interopRequireDefault(_get5);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

require("bootstrap-daterangepicker");

require("./styles.scss?extract");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * TODO: complete I18N support needed.
 */
var DateRange = (function(_Webiny$Ui$FormCompon) {
    (0, _inherits3.default)(DateRange, _Webiny$Ui$FormCompon);

    function DateRange(props) {
        (0, _classCallCheck3.default)(this, DateRange);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DateRange.__proto__ || Object.getPrototypeOf(DateRange)).call(this, props)
        );

        _this.input = null;

        (0, _assign3.default)(_this.state, {
            date: {
                start: null,
                end: null
            },
            rangeType: (0, _get6.default)(_this.props, "rangeType", "")
        });

        var moment = props.moment;

        _this.options = {
            autoApply: true,
            alwaysShowCalendars: true,
            opens: "left",
            locale: {
                format: "DD/MMM/YY"
            },
            ranges: {
                Today: [moment(), moment()],
                Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
                "Last 7 Days": [moment().subtract(6, "days"), moment()],
                "Last 30 Days": [moment().subtract(29, "days"), moment()],
                "This Month": [moment().startOf("month"), moment().endOf("month")],
                "Last Month": [
                    moment()
                        .subtract(1, "month")
                        .startOf("month"),
                    moment()
                        .subtract(1, "month")
                        .endOf("month")
                ]
            }
        };

        _this.availableOptions = [
            "startDate",
            "endDate",
            "minDate",
            "maxDate",
            "dateLimit",
            "showDropdowns",
            "showWeekNumbers",
            "timePicker",
            "timePickerIncrement",
            "timePicker24hour",
            "timePickerSeconds",
            "ranges",
            "opens",
            "drops",
            "buttonClasses",
            "applyClasses",
            "cancelClasses",
            "locale",
            "singleDatePicker",
            "autoApply",
            "linkedCalendars",
            "parentEl",
            "isInvalidDate",
            "autoUpdateInput",
            "alwaysShowCalendars"
        ];

        _this.bindMethods("setup,onChange,setInitialRange");
        return _this;
    }

    (0, _createClass3.default)(DateRange, [
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate(prevProps, prevState) {
                (0, _get4.default)(
                    DateRange.prototype.__proto__ || Object.getPrototypeOf(DateRange.prototype),
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
            key: "componentWillUnmount",
            value: function componentWillUnmount(props) {
                (0, _get4.default)(
                    DateRange.prototype.__proto__ || Object.getPrototypeOf(DateRange.prototype),
                    "componentWillUnmount",
                    this
                ).call(this, props);
                this.unregisterListeners();
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (!this.getInput()) {
                    return;
                }

                if (!props.value) {
                    this.getInput().value = this.getPlaceholder() || "";
                } else {
                    var dates = props.value.split(this.props.rangeDelimiter);
                    this.element.data("daterangepicker").setStartDate(dates[0]);
                    this.element.data("daterangepicker").setEndDate(dates[1]);
                }
            }
        },
        {
            key: "setInitialRange",
            value: function setInitialRange(start, end) {
                var moment = this.props.moment;

                var from = moment(start, this.options.locale.format, true);
                var to = moment(end, this.options.locale.format, true);
                if (from.isValid() && to.isValid()) {
                    this.options.startDate = start;
                    this.options.endDate = end;
                }
            }
        },
        {
            key: "getInput",
            value: function getInput() {
                return this.input;
            }
        },
        {
            key: "setup",
            value: function setup() {
                var _this2 = this;

                this.element = (0, _jquery2.default)(this.getInput());

                // detect to which side we need to open the range selector in case opens is set to auto
                var opens = "left";
                if (this.props.opens === "auto") {
                    var left = this.element.offset().left;
                    var windowWidth = window.innerWidth;

                    var offset = left / windowWidth * 100;

                    // if within first 30% of the screen, open to left
                    if (offset <= 30) {
                        opens = "right";
                    } else if (offset > 30 && offset <= 60) {
                        opens = "center";
                    } else {
                        opens = "left";
                    }
                }

                var range = (0, _get6.default)(
                    this.options.ranges,
                    (0, _get6.default)(this.props, "rangeType")
                );
                (0, _assign3.default)(
                    this.options,
                    this.props.options || {},
                    (0, _pick3.default)(this.props, this.availableOptions)
                );
                this.options.locale.format = this.props.inputFormat;
                this.options.opens = opens;

                var value = this.getValue();
                if (value) {
                    var parts = value.split(this.props.rangeDelimiter);
                    this.setInitialRange(parts[0], parts[1]);
                } else if (range) {
                    this.setInitialRange(range[0], range[1]);
                }

                this.element.daterangepicker(this.options);
                this.element.on("apply.daterangepicker", function(ev, picker) {
                    _this2.onChange(picker);
                });

                if (!value) {
                    this.element[0].value = this.getPlaceholder() || "";
                }

                return this;
            }
        },
        {
            key: "onChange",
            value: function onChange() {
                var _this3 = this;

                var picker = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                try {
                    if (!this.getInput()) {
                        return this;
                    }

                    var moment = this.props.moment;

                    var dates = this.getInput().value.split(" - ");
                    var from = moment(dates[0], this.props.inputFormat, true);
                    var to = moment(dates[1], this.props.inputFormat, true);

                    if (from.isValid() && to.isValid()) {
                        var fromYmd = from.format(this.props.modelFormat);
                        var toYmd = to.format(this.props.modelFormat);
                        var state = {
                            date: {
                                range: fromYmd + this.props.rangeDelimiter + toYmd,
                                from: fromYmd,
                                to: toYmd
                            },
                            rangeType: (0, _get6.default)(
                                picker,
                                "chosenLabel",
                                this.state.rangeType
                            )
                        };
                        this.setState(state, function() {
                            _this3.props.onChange(_this3.state.date.range, _this3.validate);
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        },
        {
            key: "unregisterListeners",
            value: function unregisterListeners() {
                this.element.off("apply.daterangepicker");
                return this;
            }
        },
        {
            key: "renderPreview",
            value: function renderPreview() {
                if (!this.state.date.range) {
                    return null;
                }

                var moment = this.props.moment;

                var dates = this.state.date.range.split(this.props.rangeDelimiter);
                var from = moment(dates[0], this.props.modelFormat, true);
                var to = moment(dates[1], this.props.modelFormat, true);

                return from.format(
                    this.props.inputFormat + " - " + to.format(this.props.inputFormat)
                );
            }
        }
    ]);
    return DateRange;
})(_webinyApp.Webiny.Ui.FormComponent);

DateRange.defaultProps = _webinyApp.Webiny.Ui.FormComponent.extendProps({
    inputFormat: "YYYY-MM-DD",
    modelFormat: "YYYY-MM-DD",
    rangeDelimiter: ":",
    rangeType: "Last 30 Days", // initial date range
    opens: "auto",
    renderer: function renderer() {
        var _this4 = this;

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

        props.addonRight = _react2.default.createElement(Icon, { icon: "icon-calendar" });
        props.value = this.renderPreview();
        props.onComponentDidMount = function(input) {
            _this4.input = input;
            _this4.setup();
        };

        return _react2.default.createElement(
            Input,
            (0, _extends3.default)(
                {
                    onRef: function onRef(ref) {
                        return (_this4.input = ref);
                    }
                },
                props
            )
        );
    }
});

exports.default = _webinyApp.Webiny.createComponent(DateRange, {
    modules: ["Icon", "Input", { moment: "Webiny/Vendors/Moment" }]
});
//# sourceMappingURL=index.js.map
