"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _filter2 = require("lodash/filter");

var _filter3 = _interopRequireDefault(_filter2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _SelectRowField = require("./Fields/SelectRowField");

var _SelectRowField2 = _interopRequireDefault(_SelectRowField);

var _Actions = require("./Actions");

var _Actions2 = _interopRequireDefault(_Actions);

var _FieldInfo = require("./FieldInfo");

var _FieldInfo2 = _interopRequireDefault(_FieldInfo);

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Row = (function(_React$Component) {
    (0, _inherits3.default)(Row, _React$Component);

    function Row(props) {
        (0, _classCallCheck3.default)(this, Row);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Row.__proto__ || Object.getPrototypeOf(Row)).call(this, props)
        );

        _this.fields = [];
        _this.actionsElement = null;
        _this.selectRowElement = null;
        _this.data = props.data;

        ["prepareChildren", "prepareChild", "renderField", "onClick", "isDisabled"].map(function(
            m
        ) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Row, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.prepareChildren(this.props.children);
                if (this.props.attachToTable) {
                    this.props.attachToTable(this, this.props.index);
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                this.data = props.data;
                this.prepareChildren(props.children);
                if (this.props.attachToTable) {
                    this.props.attachToTable(this, props.index);
                }
            }
        },
        {
            key: "isDisabled",
            value: function isDisabled() {
                var disabled = this.props.disabled;

                return (0, _isFunction3.default)(disabled) ? disabled(this.props.data) : disabled;
            }
        },
        {
            key: "prepareChild",
            value: function prepareChild(child) {
                if (
                    (typeof child === "undefined" ? "undefined" : (0, _typeof3.default)(child)) !==
                        "object" ||
                    child === null
                ) {
                    return child;
                }

                var tableField = (0, _webinyApp.elementHasFlag)(child, "tableField");
                if (tableField) {
                    if ((0, _webinyApp.isElementOfType)(child, _SelectRowField2.default)) {
                        this.selectRowElement = true;
                    }

                    // Only evaluate `hide` condition if it is a plain value (not a function)
                    if (!(0, _isFunction3.default)(child.props.hide) && child.props.hide) {
                        return;
                    }

                    this.fields.push(child);
                    return;
                }

                var tableActions = (0, _webinyApp.isElementOfType)(child, _Actions2.default);
                if (tableActions && !child.props.hide) {
                    this.actionsElement = _react2.default.cloneElement(child, {
                        data: this.data,
                        actions: this.props.actions
                    });
                }
            }
        },
        {
            key: "prepareChildren",
            value: function prepareChildren(children) {
                this.fields = [];
                this.actionsElement = null;

                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }
                return _react2.default.Children.map(children, this.prepareChild);
            }
        },
        {
            key: "renderField",
            value: function renderField(field, i) {
                var _this2 = this;

                var props = (0, _omit3.default)(field.props, ["children"]);
                (0, _assign3.default)(props, {
                    data: this.data,
                    name: props.name,
                    label: props.label,
                    key: i,
                    sorted: this.props.sorters[props.name] || null,
                    actions: this.props.actions,
                    rowIndex: this.props.index,
                    rowDetailsExpanded: this.props.expanded,
                    rowSelected: this.props.selected,
                    rowDisabled: this.isDisabled(),
                    onSelect: function onSelect(value) {
                        return _this2.props.onSelect(_this2.props.data, value);
                    },
                    onSelectAll: function onSelectAll(value) {
                        return _this2.props.onSelectAll(value);
                    }
                });

                // Filter Field children
                var childrenArray = (0, _isArray3.default)(field.props.children)
                    ? field.props.children
                    : [field.props.children];
                var children = [];
                (0, _filter3.default)(childrenArray).map(function(fieldChild) {
                    // Do not include FieldInfo in Field children
                    if (!(0, _webinyApp.isElementOfType)(fieldChild, _FieldInfo2.default)) {
                        children.push(fieldChild);
                    }
                });

                return _react2.default.cloneElement(
                    field,
                    props,
                    children.length === 1 ? children[0] : children
                );
            }
        },
        {
            key: "onClick",
            value: function onClick() {
                var onClick = this.props.onClick;
                if ((0, _isString3.default)(onClick) && onClick === "toggleRowDetails") {
                    this.props.actions.toggleRowDetails(this.props.index)();
                } else if ((0, _isFunction3.default)(onClick)) {
                    onClick.call(this, { data: this.data, $this: this });
                }
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (this.props.onSelect && !this.selectRowElement) {
                    this.fields.splice(
                        0,
                        0,
                        _react2.default.createElement(_SelectRowField2.default, null)
                    );
                }

                var classes = this.props.className;
                if ((0, _isFunction3.default)(classes)) {
                    classes = classes(this.props.data);
                }

                return _react2.default.createElement(
                    "tr",
                    {
                        className: (0, _classnames2.default)(
                            classes,
                            this.props.selected && _styles2.default.selected
                        ),
                        onClick: this.onClick
                    },
                    this.fields.map(this.renderField),
                    this.actionsElement
                        ? _react2.default.createElement(
                              "td",
                              { className: this.props.actionsClass },
                              this.actionsElement
                          )
                        : null
                );
            }
        }
    ]);
    return Row;
})(_react2.default.Component);

Row.defaultProps = {
    className: null,
    onClick: _noop3.default,
    disabled: false,
    actionsClass: "text-center"
};

exports.default = (0, _webinyApp.createComponent)(Row, { styles: _styles2.default });
//# sourceMappingURL=Row.js.map
