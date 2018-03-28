"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

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

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isUndefined2 = require("lodash/isUndefined");

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isNull2 = require("lodash/isNull");

var _isNull3 = _interopRequireDefault(_isNull2);

var _pickBy2 = require("lodash/pickBy");

var _pickBy3 = _interopRequireDefault(_pickBy2);

var _isObject2 = require("lodash/isObject");

var _isObject3 = _interopRequireDefault(_isObject2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Type to search"], ["Type to search"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _warning = require("warning");

var _warning2 = _interopRequireDefault(_warning);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Search");

var Search = (function(_React$Component) {
    (0, _inherits3.default)(Search, _React$Component);

    function Search(props) {
        (0, _classCallCheck3.default)(this, Search);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Search.__proto__ || Object.getPrototypeOf(Search)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState, {
            query: "", // Value being searched
            preview: "", // Rendered value of selected value
            options: [],
            loading: false,
            selectedOption: -1, // Selected option index
            selectedData: null // Delected item data
        });

        _this.mounted = false;
        _this.preventBlur = false;
        _this.delay = null;
        _this.currentValueIsId = false;
        _this.filters = {};
        _this.unwatch = _noop3.default;

        [
            "loadOptions",
            "inputChanged",
            "selectItem",
            "selectCurrent",
            "onKeyUp",
            "onBlur",
            "renderPreview",
            "fetchValue",
            "getCurrentData",
            "applyFreeInput"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });

        if (_this.props.filterBy) {
            // Assume the most basic form of filtering (single string)
            var name = _this.props.filterBy;
            var filter = _this.props.filterBy;

            // Check if filterBy is defined as array (0 => name of the input to watch, 1 => filter by field)
            if ((0, _isArray3.default)(_this.props.filterBy)) {
                name = _this.props.filterBy[0];
                filter = _this.props.filterBy[1];
            }

            // Check if filterBy is defined as object
            if ((0, _isPlainObject3.default)(_this.props.filterBy)) {
                name = _this.props.filterBy.name;
                filter = _this.props.filterBy.filter;
            }

            _this.filterName = name;
            _this.filterField = filter;

            _this.unwatch = _this.props.form.watch(name, function(newValue) {
                return _this.applyFilter(newValue, name, filter);
            });
        }
        return _this;
    }

    (0, _createClass3.default)(Search, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if ((0, _isEqual3.default)(props.value, this.props.value)) {
                    return;
                }

                this.normalizeValue(props);
            }
        },
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.normalizeValue(this.props);
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.mounted = true;
                this.props.attachToForm && this.props.attachToForm(this);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;
                this.unwatch();
            }

            /** Custom methods */

            /**
             * We support 3 types of values:
             * - id
             * - object
             * - random string
             *
             * @param props
             */
        },
        {
            key: "normalizeValue",
            value: function normalizeValue(props) {
                var _this2 = this;

                var value = props.value;

                var newState = {
                    options: [],
                    selectedOption: -1,
                    query: ""
                };

                // Try to extract ID
                var id = null;
                if (value && (0, _isString3.default)(value) && value.match(/^[0-9a-fA-F]{24}$/)) {
                    id = value;
                } else if (value && (0, _isPlainObject3.default)(value)) {
                    id = value.id;
                    newState["selectedData"] = value;
                }

                if (!id && value) {
                    newState["preview"] = value;
                } else if (id && (0, _isPlainObject3.default)(value)) {
                    newState["preview"] = this.renderPreview(value);
                } else if (id) {
                    this.props.api
                        .get(this.props.api.defaults.url + "/" + value)
                        .then(function(response) {
                            var data = response.data.data.entity;
                            _this2.setState({
                                selectedData: data,
                                preview: _this2.renderPreview(data)
                            });
                        });
                }

                this.currentValueIsId = !!id;
                this.setState(newState);
            }
        },
        {
            key: "getCurrentData",
            value: function getCurrentData() {
                return this.state.selectedData;
            }
        },
        {
            key: "applyFilter",
            value: function applyFilter(newValue, name, filter) {
                // If filter is a function, it needs to return a config for api created using new value
                if ((0, _isFunction3.default)(filter)) {
                    var config = filter(newValue, this.api);
                    if ((0, _isPlainObject3.default)(config)) {
                        this.filters = config;
                    }
                } else {
                    // If filter is a string, create a filter object using that string as field name
                    var filters = {};
                    filters[filter] = (0, _isObject3.default)(newValue) ? newValue.id : newValue;
                    this.filters = filters;
                }
                this.filters = (0, _pickBy3.default)(this.filters, function(v) {
                    return !(0, _isNull3.default)(v) && !(0, _isUndefined3.default)(v) && v !== "";
                });
            }
        },
        {
            key: "loadOptions",
            value: function loadOptions(query) {
                var _this3 = this;

                this.setState({ query: query });
                clearTimeout(this.delay);

                this.delay = setTimeout(function() {
                    if (
                        (0, _isEmpty3.default)(_this3.state.query) ||
                        _this3.state.query.length < _this3.props.minQueryLength
                    ) {
                        return;
                    }

                    if (_this3.mounted) {
                        _this3.setState({ loading: true });
                        _this3.props.api
                            .request({
                                params: Object.assign(
                                    { _searchQuery: _this3.state.query },
                                    _this3.filters
                                )
                            })
                            .then(function(response) {
                                var data = response.data.data;

                                _this3.setState(
                                    {
                                        options: (0, _get3.default)(data, "list", data),
                                        loading: false
                                    },
                                    function() {
                                        _this3.props.onLoadOptions({
                                            options: _this3.state.options
                                        });
                                    }
                                );
                            });
                    }
                }, this.props.allowFreeInput ? 300 : 500);
            }
        },
        {
            key: "inputChanged",
            value: function inputChanged(e) {
                if (this.props.value && this.currentValueIsId && this.props.allowFreeInput) {
                    this.props.onChange(e.target.value);
                }
                this.setState({
                    query: e.target.value,
                    preview: "",
                    selectedData: null
                });
                if (e.target.value.length >= 2) {
                    this.loadOptions(e.target.value);
                }
            }
        },
        {
            key: "onKeyUp",
            value: function onKeyUp(e) {
                this.key = e.key;

                if (e.metaKey || e.ctrlKey) {
                    return;
                }

                switch (this.key) {
                    case "Backspace":
                        if (
                            (0, _isEmpty3.default)(this.state.query) ||
                            (0, _get3.default)(this.props, "value")
                        ) {
                            // Reset only if it is a selected value with valid mongo ID or data object
                            var id = (0, _get3.default)(this.props, "value");
                            if (
                                this.props.allowFreeInput &&
                                (0, _isString3.default)(id) &&
                                !id.match(/^[0-9a-fA-F]{24}$/)
                            ) {
                                this.inputChanged(e);
                                break;
                            }
                            this.reset();
                            break;
                        } else {
                            this.inputChanged(e);
                        }
                        break;
                    case "ArrowDown":
                        this.selectNext();
                        break;
                    case "ArrowUp":
                        this.selectPrev();
                        break;
                    case "Enter":
                        e.stopPropagation();
                        e.preventDefault();
                        if (this.state.options.length > 0) {
                            this.selectCurrent();
                        } else if (this.props.allowFreeInput) {
                            this.applyFreeInput();
                        } else {
                            this.props.onEnter({ event: e });
                        }
                        break;
                    case "Escape":
                        this.onBlur();
                        break;
                    case "Tab":
                    case "ArrowLeft":
                    case "ArrowRight":
                        break;
                    default:
                        this.inputChanged(e);
                        break;
                }
            }
        },
        {
            key: "onBlur",
            value: function onBlur() {
                if (this.preventBlur) {
                    return;
                }

                if (!this.props.allowFreeInput) {
                    var state = { options: [] };
                    if (!(0, _get3.default)(this.props, "value")) {
                        state["query"] = "";
                        state["selectedOption"] = -1;
                    }
                    this.setState(state, this.props.validate);
                }

                if (this.props.allowFreeInput) {
                    this.applyFreeInput();
                }
            }
        },
        {
            key: "applyFreeInput",
            value: function applyFreeInput() {
                if (
                    !this.state.selectedData &&
                    !(this.state.query === "" && this.state.preview !== "")
                ) {
                    this.props.onChange(this.state.query);
                    setTimeout(this.props.validate, 10);
                }
            }
        },
        {
            key: "selectItem",
            value: function selectItem(item) {
                var _this4 = this;

                this.preventBlur = true;
                this.setState(
                    {
                        selectedOption: -1,
                        query: "",
                        options: [],
                        preview: this.renderPreview(item),
                        selectedData: item
                    },
                    function() {
                        _this4.props.onChange(
                            _this4.props.useDataAsValue ? item : item[_this4.props.valueAttr]
                        );
                        setTimeout(_this4.props.validate, 10);
                        _this4.preventBlur = false;
                    }
                );
            }
        },
        {
            key: "selectNext",
            value: function selectNext() {
                if (!this.state.options.length) {
                    return;
                }

                var selected = this.state.selectedOption + 1;
                if (selected >= this.state.options.length) {
                    selected = this.state.options.length - 1;
                }

                this.setState({
                    selectedOption: selected,
                    preview: this.renderPreview(this.state.options[selected])
                });
            }
        },
        {
            key: "selectPrev",
            value: function selectPrev() {
                if (!this.state.options.length) {
                    return;
                }

                var selected = this.state.options.length - 1;
                if (this.state.selectedOption <= selected) {
                    selected = this.state.selectedOption - 1;
                }

                if (selected < 0) {
                    selected = 0;
                }

                this.setState({
                    selectedOption: selected,
                    preview: this.renderPreview(this.state.options[selected])
                });
            }
        },
        {
            key: "selectCurrent",
            value: function selectCurrent() {
                if (!this.state.options.length) {
                    return;
                }

                if (this.state.selectedOption === -1) {
                    return;
                }

                var current = this.state.options[this.state.selectedOption];
                this.selectItem(current);
            }
        },
        {
            key: "reset",
            value: function reset() {
                var _this5 = this;

                this.setState(
                    {
                        selectedOption: -1,
                        query: "",
                        preview: "",
                        options: [],
                        selectedData: null
                    },
                    function() {
                        _this5.props.onChange(null);
                        _this5.props.onReset();
                    }
                );
            }
        },
        {
            key: "fetchValue",
            value: function fetchValue(_ref) {
                var item = _ref.data;

                var value = (0, _get3.default)(item, this.props.textAttr, item.id);

                (0, _warning2.default)(
                    value,
                    "Warning: Item attribute '" +
                        this.props.textAttr +
                        "' was not found in the results of '" +
                        this.props.name +
                        "' component.\nMissing or misspelled 'fields' parameter?"
                );

                return value;
            }
        },
        {
            key: "renderPreview",
            value: function renderPreview(item) {
                if (!item) {
                    return null;
                }
                return this.props.renderSelected.call(this, { option: { data: item } });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var FormGroup = this.props.FormGroup;

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    this.props.renderInfo.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: "inputGroup" },
                        this.props.renderSearchInput.call(this, { $this: this })
                    ),
                    this.props.renderDescription.call(this),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Search;
})(_react2.default.Component);

Search.defaultProps = {
    searchOperator: "or",
    valueAttr: "id",
    textAttr: "name",
    minQueryLength: 2,
    onEnter: _noop3.default,
    onChange: _noop3.default,
    onReset: _noop3.default,
    onLoadOptions: _noop3.default,
    inputIcon: "icon-search",
    loadingIcon: "icon-search",
    placeholder: t(_templateObject),
    useDataAsValue: false,
    allowFreeInput: false,
    renderOptionLabel: function renderOptionLabel(_ref2) {
        var option = _ref2.option;

        var value = this.fetchValue(option);
        var content = { __html: value.replace(/\s+/g, "&nbsp;") };
        return _react2.default.createElement("div", { dangerouslySetInnerHTML: content });
    },
    renderSelected: function renderSelected(_ref3) {
        var option = _ref3.option;

        return this.fetchValue(option);
    },
    renderOption: function renderOption(_ref4) {
        var _this6 = this;

        var item = _ref4.item,
            index = _ref4.index;
        var styles = this.props.styles;

        var itemClasses = (0, _defineProperty3.default)(
            {},
            styles.selected,
            index === this.state.selectedOption
        );

        var linkProps = {
            onMouseDown: function onMouseDown() {
                return _this6.selectItem(item);
            },
            onMouseOver: function onMouseOver() {
                return _this6.setState({
                    selectedOption: index,
                    preview: _this6.renderPreview(item)
                });
            }
        };

        return _react2.default.createElement(
            "li",
            (0, _extends3.default)(
                { key: index, className: (0, _classnames2.default)(itemClasses) },
                linkProps
            ),
            _react2.default.createElement(
                "a",
                { href: "javascript:void(0)" },
                this.props.renderOptionLabel.call(this, { option: { data: item } })
            )
        );
    },
    renderSearchInput: function renderSearchInput() {
        var _this7 = this;

        var inputProps = {
            type: "text",
            readOnly: this.props.readOnly || false,
            placeholder: this.props.placeholder,
            autoComplete: "off",
            spellCheck: "false",
            dir: "auto",
            onKeyDown: this.onKeyUp,
            onBlur: this.onBlur,
            value: this.state.query || this.state.preview || "",
            onChange: this.inputChanged,
            disabled: this.props.isDisabled()
        };

        // Render option
        var options = this.state.options.map(function(item, index) {
            return _this7.props.renderOption.call(_this7, { item: item, index: index });
        });

        var dropdownMenu = null;
        var styles = this.props.styles;

        if (this.state.options.length > 0) {
            dropdownMenu = _react2.default.createElement(
                "div",
                { className: styles.autosuggest },
                _react2.default.createElement(
                    "div",
                    { className: styles.plainSearch },
                    _react2.default.createElement("ul", null, options)
                )
            );
        }

        // Create search input
        var _props = this.props,
            Link = _props.Link,
            Icon = _props.Icon;

        return _react2.default.createElement(
            "div",
            { className: styles.search },
            _react2.default.createElement(
                Link,
                { className: styles.btn },
                _react2.default.createElement(Icon, {
                    className: styles.icon,
                    icon: this.props.loading ? this.props.loadingIcon : this.props.inputIcon
                })
            ),
            _react2.default.createElement("input", inputProps),
            dropdownMenu
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(
    [Search, _webinyApp.ApiComponent, _webinyAppUi.FormComponent],
    {
        modules: ["Link", "Icon", "FormGroup"],
        styles: _styles2.default,
        formComponent: true
    }
);
//# sourceMappingURL=index.js.map
