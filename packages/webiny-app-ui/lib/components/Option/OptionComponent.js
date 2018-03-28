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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isNumber2 = require("lodash/isNumber");

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isObject2 = require("lodash/isObject");

var _isObject3 = _interopRequireDefault(_isObject2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var OptionComponent = (function(_React$Component) {
    (0, _inherits3.default)(OptionComponent, _React$Component);

    function OptionComponent(props) {
        (0, _classCallCheck3.default)(this, OptionComponent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (OptionComponent.__proto__ || Object.getPrototypeOf(OptionComponent)).call(this, props)
        );

        _this.state = {
            options: [],
            loading: false
        };

        _this.mounted = false;
        _this.cancelRequest = null;

        _this.loadOptions = _this.loadOptions.bind(_this);
        _this.normalizeOptions = _this.normalizeOptions.bind(_this);
        _this.setFilters = _this.setFilters.bind(_this);
        _this.applyFilter = _this.applyFilter.bind(_this);

        if (_this.props.filterBy) {
            // Assume the most basic form of filtering (single string)
            var name = _this.props.filterBy;
            var filter = _this.props.filterBy;
            var loadIfEmpty = false;

            // Check if filterBy is defined as array (0 => name of the input to watch, 1 => filter by field)
            if ((0, _isArray3.default)(_this.props.filterBy)) {
                name = _this.props.filterBy[0];
                filter = _this.props.filterBy[1];
            }

            // Check if filterBy is defined as object
            if ((0, _isPlainObject3.default)(_this.props.filterBy)) {
                name = _this.props.filterBy.name;
                filter = _this.props.filterBy.filter;
                loadIfEmpty = (0, _get3.default)(_this.props.filterBy, "loadIfEmpty", loadIfEmpty);
            }

            _this.filterName = name;
            _this.filterField = filter;
            _this.filterLoadIfEmpty = loadIfEmpty;

            _this.unwatch = _this.props.form.watch(name, function(newValue) {
                return _this.applyFilter(newValue, name, filter, loadIfEmpty);
            });
        }
        return _this;
    }

    (0, _createClass3.default)(OptionComponent, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.mounted = true;
                if (
                    !this.props.filterBy ||
                    this.props.value !== null ||
                    (this.filterName && this.props.form.getModel(this.filterName))
                ) {
                    this.loadOptions(this.props);
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                var pick = ["options", "children"];
                var oldProps = (0, _pick3.default)(this.props, pick);
                var newProps = (0, _pick3.default)(props, pick);
                if (!(0, _isEqual3.default)(newProps, oldProps) && !this.props.api) {
                    this.loadOptions(props);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;

                if (this.unwatch) {
                    this.unwatch();
                }

                if (this.cancelRequest) {
                    this.cancelRequest();
                }
            }
        },
        {
            key: "applyFilter",
            value: function applyFilter(newValue, name, filter, loadIfEmpty) {
                if (newValue === null && !loadIfEmpty) {
                    this.setState({ options: [] });
                    this.props.onChange(null);
                    return;
                }

                // If filter is a function, it needs to return a config for api created using new value
                if ((0, _isFunction3.default)(filter)) {
                    var config = filter(newValue, this.props.api);
                    if ((0, _isPlainObject3.default)(config)) {
                        this.setFilters(config);
                    } else {
                        this.loadOptions();
                    }
                } else {
                    // If filter is a string, create a filter object using that string as field name
                    var filters = {};
                    filters[filter] = (0, _isObject3.default)(newValue) ? newValue.id : newValue;
                    this.setFilters(filters);
                }
            }
        },
        {
            key: "setFilters",
            value: function setFilters(filters) {
                this.props.api.defaults.params = Object.assign(
                    {},
                    this.props.api.defaults.params,
                    filters
                );
                this.loadOptions();
                return this;
            }
        },
        {
            key: "loadOptions",
            value: function loadOptions() {
                var _this2 = this;

                var props =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var options = [];
                if (!props) {
                    props = this.props;
                }

                if (props.options) {
                    if ((0, _isPlainObject3.default)(props.options)) {
                        (0, _each3.default)(props.options, function(value, key) {
                            options.push({
                                id: key,
                                text: value
                            });
                        });
                    }

                    if ((0, _isArray3.default)(props.options)) {
                        options = this.normalizeOptions(props, props.options);
                    }

                    return this.setState({ options: options });
                }

                if (this.props.api) {
                    var query = {};
                    if (this.props.filterBy) {
                        // Get current value of the field that filters current field
                        var filter = null;
                        var filteredByValue = this.props.form.getModel(this.filterName);

                        // Do not load options if `loadIfEmpty` is not defined
                        if (
                            !filteredByValue &&
                            filteredByValue !== false &&
                            !this.filterLoadIfEmpty
                        ) {
                            return null;
                        }

                        if ((0, _isFunction3.default)(this.filterField)) {
                            filter = this.filterField(filteredByValue, this.props.api);
                            if ((0, _isPlainObject3.default)(filter)) {
                                (0, _merge3.default)(query, filter);
                            }
                        }

                        if ((0, _isString3.default)(this.filterField)) {
                            query[this.filterField] = filteredByValue;
                        }

                        this.props.api.defaults.params = Object.assign(
                            {},
                            this.props.api.defaults.params,
                            query
                        );
                    }

                    this.setState({ loading: true });
                    this.request = this.props.api
                        .request({
                            cancelToken: new _axios2.default.CancelToken(function(cancel) {
                                _this2.cancelRequest = cancel;
                            })
                        })
                        .then(function(apiResponse) {
                            _this2.request = null;
                            _this2.cancelRequest = null;

                            var data = apiResponse.data.data;

                            if ((0, _isPlainObject3.default)(data) && Array.isArray(data.list)) {
                                data = data.list;
                            }

                            if (_this2.props.prepareLoadedData) {
                                data = _this2.props.prepareLoadedData({ data: data });
                            }

                            _this2.setState({
                                options: _this2.normalizeOptions(props, data),
                                loading: false
                            });
                        })
                        .catch(function(err) {
                            if (_axios2.default.isCancel(err)) {
                                return _this2.mounted ? _this2.setState({ loading: false }) : null;
                            }
                            console.log(err);
                        });

                    return this.request;
                }

                /**
                 * Check options defined using <option> element.
                 * Since this is a HOC, we need to access the actual UI component's children.
                 * As a reminder, the structure looks like this:
                 *
                 * <OptionComponent> <-- this is where we currently are
                 *     <Select>
                 *         <option value={x}>Label X</option>
                 *         <option value={y}>Label Y</option>
                 *     </Select>
                 * </OptionComponent>
                 */
                var uiElement = props.children;

                if (uiElement.props.children) {
                    _react2.default.Children.map(uiElement.props.children, function(child) {
                        if (child.type === "option") {
                            options.push({
                                id: child.props.value,
                                text: _this2.renderOptionText(uiElement.props, child.props.children)
                            });
                        }
                    });
                    return this.setState({ options: options });
                }
            }
        },
        {
            key: "normalizeOptions",
            value: function normalizeOptions(props, data) {
                var _this3 = this;

                var options = [];
                (0, _each3.default)(data, function(option, key) {
                    if (
                        (0, _isString3.default)(key) &&
                        ((0, _isString3.default)(option) || (0, _isNumber3.default)(option))
                    ) {
                        options.push({ id: key, text: "" + option, data: null });
                        return;
                    }

                    var id = (0, _isPlainObject3.default)(option)
                        ? option[props.valueAttr || "id"]
                        : "" + option;
                    var text = _this3.renderOptionText(props, option);
                    // Add data to option so we can run it through selectedRenderer when item selection changes
                    options.push({ id: id, text: text, data: option });
                });

                return options;
            }
        },
        {
            key: "renderOptionText",
            value: function renderOptionText(props, option) {
                if (props.optionRenderer) {
                    return props.optionRenderer({ option: { data: option } });
                } else if (
                    (0, _isPlainObject3.default)(option) &&
                    !_react2.default.isValidElement(option)
                ) {
                    return (0, _get3.default)(option, props.textAttr);
                } else if ((0, _isString3.default)(option)) {
                    return option;
                }
                return (0, _isArray3.default)(option) ? option[0] : option;
            }
        },
        {
            key: "render",
            value: function render() {
                return _react2.default.cloneElement(
                    this.props.children,
                    Object.assign({}, (0, _omit3.default)(this.props, ["children"]), {
                        options: this.state.options
                    })
                );
            }
        }
    ]);
    return OptionComponent;
})(_react2.default.Component);

OptionComponent.defaultProps = {
    valueAttr: "id", // Attribute to use as option value (when option is a an object, usually used with API)
    textAttr: "name", // Attribute to use as option text (when option is a an object, usually used with API)
    useDataAsValue: false, // Will assign selected/checked value in form of data (usually from API)
    valueKey: null, // used only for rendering to map complex options to model values (only used when component value is an object)
    filterBy: null,
    prepareLoadedData: null
};

exports.default = (0, _webinyApp.createComponent)([
    OptionComponent,
    _webinyApp.ApiComponent,
    _webinyAppUi.FormComponent
]);
//# sourceMappingURL=OptionComponent.js.map
