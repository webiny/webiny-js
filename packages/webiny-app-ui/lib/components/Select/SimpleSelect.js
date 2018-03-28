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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _isObject2 = require("lodash/isObject");

var _isObject3 = _interopRequireDefault(_isObject2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

var _server = require("react-dom/server");

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var SimpleSelect = (function(_React$Component) {
    (0, _inherits3.default)(SimpleSelect, _React$Component);

    function SimpleSelect(props) {
        (0, _classCallCheck3.default)(this, SimpleSelect);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (SimpleSelect.__proto__ || Object.getPrototypeOf(SimpleSelect)).call(this, props)
        );

        _this.select2 = null;
        _this.options = null;
        [
            "getConfig",
            "getValue",
            "triggerChange",
            "getSelect2InputElement",
            "itemRenderer",
            "getCurrentData",
            "getPreviousData"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(SimpleSelect, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.instantiate();
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (props.value !== this.props.value) {
                    this.previousData = (0, _clone3.default)(this.getCurrentData());
                }
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                var _this2 = this;

                this.instantiate();
                var possibleValues = (0, _map3.default)(this.options, function(obj) {
                    return obj.id.toString();
                });
                var value = this.getValue();
                var inPossibleValues = possibleValues.indexOf(value) > -1;

                if (!this.options || !(0, _isEqual3.default)(this.props.options, this.options)) {
                    this.select2.empty();
                    this.getSelect2InputElement().select2(this.getConfig(this.props));
                    setTimeout(function() {
                        _this2.select2.val(_this2.getValue()).trigger("change");
                    }, 100);
                }

                (0, _jquery2.default)(this.dom)
                    .find("select")
                    .prop("disabled", !!this.props.disabled);

                if (value !== null && !inPossibleValues && possibleValues.length > 0) {
                    this.triggerChange(null);
                    return;
                }

                if (value !== null && inPossibleValues) {
                    this.select2.val(value).trigger("change");
                    return;
                }

                // Select first value if model is empty and "autoSelectFirstOptionOption" is enabled
                if (value === null && this.props.autoSelectFirstOption) {
                    var firstValue = (0, _get3.default)(this.props.options, "0.id");
                    if (firstValue) {
                        this.triggerChange(firstValue);
                    }
                    return;
                }

                this.select2.val("").trigger("change");
            }
        },
        {
            key: "instantiate",
            value: function instantiate() {
                var _this3 = this;

                if (!this.select2) {
                    this.select2 = this.getSelect2InputElement().select2(
                        this.getConfig(this.props)
                    );
                    this.select2.on("select2:select", function(e) {
                        _this3.triggerChange(e.target.value);
                    });
                    this.select2.on("select2:unselect", function() {
                        _this3.triggerChange(null);
                    });
                    this.select2.val(this.getValue()).trigger("change");

                    if (this.props.dropdownClassName) {
                        setTimeout(function() {
                            return _this3.select2
                                .data("select2")
                                .$dropdown.addClass(_this3.props.dropdownClassName);
                        });
                    }
                }
            }
        },
        {
            key: "getSelect2InputElement",
            value: function getSelect2InputElement() {
                return (0, _jquery2.default)(this.dom).find("select");
            }
        },
        {
            key: "getValue",
            value: function getValue() {
                var value = this.props.value;
                if (value === null || value === undefined) {
                    return value;
                }

                return (0, _isObject3.default)(value) ? value.id : "" + value;
            }
        },
        {
            key: "getCurrentData",
            value: function getCurrentData() {
                if (this.props.useDataAsValue) {
                    return this.props.value;
                }

                var data = null;
                var option = (0, _find3.default)(this.options, { id: this.props.value });
                if (option) {
                    data = option.data;
                }

                return this.props.value ? data : null;
            }
        },
        {
            key: "getPreviousData",
            value: function getPreviousData() {
                return this.previousData;
            }
        },
        {
            key: "triggerChange",
            value: function triggerChange(value) {
                if (this.props.useDataAsValue && value) {
                    var selectedOption = (0, _find3.default)(this.options, { id: value });
                    if (!selectedOption.data) {
                        console.warn(
                            "Warning: attempting to use item data but data is not present in option items!"
                        );
                    } else {
                        value = selectedOption.data;
                    }
                }

                // Save previous selection data so it can be accessed from onChange handlers
                var prevValue = this.getValue();
                if (this.props.useDataAsValue) {
                    this.previousData = prevValue ? (0, _clone3.default)(prevValue) : null;
                } else {
                    var data = null;
                    var option = (0, _find3.default)(this.options, { id: prevValue });
                    if (option) {
                        data = option.data;
                    }
                    this.previousData = data ? (0, _clone3.default)(data) : null;
                }
                this.props.onChange(value);
            }
        },
        {
            key: "getOptionText",
            value: function getOptionText(text) {
                if (!text) {
                    return "";
                }

                if (text.startsWith("<")) {
                    return (0, _jquery2.default)(text);
                }

                return text || "";
            }

            /**
             * This will be triggered twice due to a bug in Select2 (https://github.com/select2/select2/pull/4306)
             * @param item
             * @param type renderOption || renderSelected
             * @returns {*}
             */
        },
        {
            key: "itemRenderer",
            value: function itemRenderer(item, type) {
                var text = item.text;
                if ((0, _isFunction3.default)(this.props[type]) && item.id) {
                    text = this.props[type]({ option: item || {} });
                }

                if (text && !(0, _isString3.default)(text)) {
                    text = _server2.default.renderToStaticMarkup(text);
                }

                return this.getOptionText(text);
            }
        },
        {
            key: "getConfig",
            value: function getConfig(props) {
                var _this4 = this;

                var config = {
                    disabled: props.disabled,
                    minimumResultsForSearch: props.minimumResultsForSearch,
                    minimumInputLength: props.minimumInputLength,
                    placeholder: props.placeholder,
                    allowClear: props.allowClear,
                    templateResult: function templateResult(item) {
                        return _this4.itemRenderer(item, "renderOption");
                    },
                    templateSelection: function templateSelection(item) {
                        return _this4.itemRenderer(item, "renderSelected");
                    }
                };

                if ((0, _isFunction3.default)(this.props.matcher)) {
                    config.matcher = function(params, data) {
                        var term = (params.term || "").trim();
                        if (!term || term.length === 0) {
                            return data;
                        }
                        return _this4.props.matcher({ term: term, option: data });
                    };
                }

                if (this.props.dropdownParent) {
                    config["dropdownParent"] = (0, _jquery2.default)(this.dom).find(
                        props.dropdownParent
                    );
                }

                if (
                    !this.options ||
                    !(0, _isEqual3.default)(props.options, this.options) ||
                    !this.select2
                ) {
                    // Prepare options
                    var options = [];
                    (0, _each3.default)(props.options, function(option) {
                        if (_react2.default.isValidElement(option.text)) {
                            option.text = _server2.default.renderToStaticMarkup(option.text);
                        }
                        options.push(option);
                    });
                    config["data"] = this.options = options;
                }

                return config;
            }
        },
        {
            key: "render",
            value: function render() {
                var _this5 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "div",
                    {
                        className: "inputGroup",
                        ref: function ref(_ref) {
                            return (_this5.dom = _ref);
                        }
                    },
                    _react2.default.createElement("select", { style: { width: "100%" } }),
                    _react2.default.createElement("div", { className: "dropdown-wrapper" })
                );
            }
        }
    ]);
    return SimpleSelect;
})(_react2.default.Component);

SimpleSelect.defaultProps = {
    value: null,
    allowClear: false,
    autoSelectFirstOption: false,
    placeholder: null,
    onChange: _noop3.default,
    minimumInputLength: 0,
    minimumResultsForSearch: 15,
    useDataAsValue: false,
    dropdownParent: ".dropdown-wrapper",
    dropdownClassName: null,
    renderOption: null,
    renderSelected: null,
    matcher: null
};

exports.default = (0, _webinyApp.createComponent)(SimpleSelect, {
    modules: ["Vendor.Select2"]
});
//# sourceMappingURL=SimpleSelect.js.map
