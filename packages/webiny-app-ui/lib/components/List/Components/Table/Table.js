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

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _Row = require("./Row");

var _Row2 = _interopRequireDefault(_Row);

var _FieldInfo = require("./FieldInfo");

var _FieldInfo2 = _interopRequireDefault(_FieldInfo);

var _Actions = require("./Actions");

var _Actions2 = _interopRequireDefault(_Actions);

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

var _RowDetails = require("./RowDetails");

var _RowDetails2 = _interopRequireDefault(_RowDetails);

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Empty = require("./Empty");

var _Empty2 = _interopRequireDefault(_Empty);

var _SelectRowField = require("./Fields/SelectRowField");

var _SelectRowField2 = _interopRequireDefault(_SelectRowField);

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Table = (function(_React$Component) {
    (0, _inherits3.default)(Table, _React$Component);

    function Table(props) {
        (0, _classCallCheck3.default)(this, Table);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Table.__proto__ || Object.getPrototypeOf(Table)).call(this, props)
        );

        _this.rowElement = null;
        _this.selectAllRowsElement = null;
        _this.rowDetailsElement = null;
        _this.footerElement = null;
        _this.emptyElement = null;
        _this.headers = [];
        _this.rows = {};

        _this.state = {
            selectAll: false,
            selectedRows: props.selectedRows,
            expandedRows: []
        };

        [
            "attachToTable",
            "prepareChildren",
            "prepareChild",
            "renderRow",
            "renderHeader",
            "onSort",
            "onSelect",
            "selectAll",
            "showRowDetails",
            "hideRowDetails",
            "toggleRowDetails"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Table, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.tempProps = this.props; // assign props to tempProps to be accessible without passing through method args
                this.prepareChildren(this.props.children);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                this.setState({ selectedRows: props.selectedRows });
                this.tempProps = props; // assign props to tempProps to be accessible without passing through method args
                this.prepareChildren(props.children);
            }
        },
        {
            key: "attachToTable",
            value: function attachToTable(row, index) {
                this.rows[index] = row;
            }
        },
        {
            key: "selectAll",
            value: function selectAll(selected) {
                var _this2 = this;

                var data = [];
                if (selected) {
                    Object.values(this.rows).map(function(row) {
                        if (!row.isDisabled()) {
                            data.push(row.props.data);
                        }
                    });
                }

                this.setState(
                    {
                        selectAll: selected,
                        selectedRows: data
                    },
                    function() {
                        if (_this2.props.onSelect) {
                            _this2.props.onSelect(_this2.state.selectedRows);
                        }
                    }
                );
            }
        },
        {
            key: "onSelect",
            value: function onSelect(data, selected) {
                var selectedRows = this.state.selectedRows;
                if (selected) {
                    selectedRows.push(data);
                } else {
                    selectedRows.splice((0, _findIndex3.default)(selectedRows, data), 1);
                }
                this.setState({ selectedRows: selectedRows });
                this.props.onSelect(selectedRows);
            }
        },
        {
            key: "onSort",
            value: function onSort(name, sort) {
                this.selectAll(false);
                this.setState({ expandedRows: [] });
                var sorters = (0, _clone3.default)(this.props.sorters);
                if (sort !== 0) {
                    sorters[name] = sort;
                } else {
                    delete sorters[name];
                }

                this.props.onSort(sorters);
            }
        },
        {
            key: "prepareChild",
            value: function prepareChild(child) {
                var _this3 = this;

                if (
                    (typeof child === "undefined" ? "undefined" : (0, _typeof3.default)(child)) !==
                        "object" ||
                    child === null
                ) {
                    return child;
                }

                // Table handles Row and Footer
                if ((0, _webinyApp.isElementOfType)(child, _Row2.default)) {
                    this.rowElement = child;
                    // Parse Row fields to extract headers
                    this.headers = [];
                    _react2.default.Children.map(child.props.children, function(rowChild) {
                        if ((0, _webinyApp.elementHasFlag)(rowChild, "tableField")) {
                            if (
                                (0, _webinyApp.isElementOfType)(rowChild, _SelectRowField2.default)
                            ) {
                                _this3.selectAllRowsElement = true;
                            }

                            // Only evaluate `hide` condition if it is a plain value (not a function)
                            if (
                                !(0, _isFunction3.default)(rowChild.props.hide) &&
                                rowChild.props.hide
                            ) {
                                return;
                            }

                            var headerProps = (0, _omit3.default)(rowChild.props, [
                                "render",
                                "renderHeader"
                            ]);
                            headerProps.sortable = headerProps.sort || false;
                            headerProps.sorted = _this3.tempProps.sorters[headerProps.sort] || 0;
                            headerProps.children = _react2.default.Children.map(
                                rowChild.props.children,
                                function(ch) {
                                    if ((0, _webinyApp.isElementOfType)(ch, _FieldInfo2.default)) {
                                        return ch;
                                    }
                                }
                            );

                            if ((0, _has3.default)(rowChild.props, "renderHeader")) {
                                headerProps.render = rowChild.props.renderHeader;
                            }
                            _this3.headers.push(headerProps);
                        }

                        if (
                            (0, _webinyApp.isElementOfType)(rowChild, _Actions2.default) &&
                            !rowChild.props.hide
                        ) {
                            _this3.headers.push({});
                        }
                    });

                    if (this.props.onSelect && !this.selectAllRowsElement) {
                        this.headers.splice(0, 0, {
                            render: _SelectRowField2.default.defaultProps.renderHeader
                        });
                    }
                } else if ((0, _webinyApp.isElementOfType)(child, _Footer2.default)) {
                    this.footerElement = child;
                } else if ((0, _webinyApp.isElementOfType)(child, _Empty2.default)) {
                    this.emptyElement = child;
                } else if ((0, _webinyApp.isElementOfType)(child, _RowDetails2.default)) {
                    this.rowDetailsElement = child;
                }
            }
        },
        {
            key: "showRowDetails",
            value: function showRowDetails(rowIndex) {
                var _this4 = this;

                return function() {
                    _this4.state.expandedRows.push(rowIndex);
                    _this4.setState({ expandedRows: _this4.state.expandedRows });
                };
            }
        },
        {
            key: "hideRowDetails",
            value: function hideRowDetails(rowIndex) {
                var _this5 = this;

                return function() {
                    _this5.state.expandedRows.splice(
                        _this5.state.expandedRows.indexOf(rowIndex),
                        1
                    );
                    _this5.setState({ expandedRows: _this5.state.expandedRows });
                };
            }
        },
        {
            key: "toggleRowDetails",
            value: function toggleRowDetails(rowIndex) {
                var _this6 = this;

                return function() {
                    if (_this6.state.expandedRows.indexOf(rowIndex) > -1) {
                        _this6.hideRowDetails(rowIndex)();
                    } else {
                        _this6.showRowDetails(rowIndex)();
                    }
                };
            }
        },
        {
            key: "prepareChildren",
            value: function prepareChildren(children) {
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
            key: "renderRow",
            value: function renderRow(data, index, element, key) {
                var props = (0, _omit3.default)(element.props, ["children"]);
                (0, _assign3.default)(props, {
                    table: this,
                    attachToTable: this.attachToTable,
                    index: index,
                    key: key,
                    data: data,
                    fieldsCount: this.headers.length + (this.props.onSelect ? 1 : 0),
                    expanded: this.state.expandedRows.indexOf(index) > -1,
                    selected: !!(0, _find3.default)(this.state.selectedRows, { id: data.id }),
                    sorters: (0, _clone3.default)(this.props.sorters),
                    actions: (0, _assign3.default)({}, this.props.actions, {
                        showRowDetails: this.showRowDetails,
                        hideRowDetails: this.hideRowDetails,
                        toggleRowDetails: this.toggleRowDetails
                    }),
                    onSelect: this.props.onSelect ? this.onSelect : null,
                    onSelectAll: this.selectAll
                });

                if (this.props.onSelect) {
                    props.onSelect = this.onSelect;
                }

                return _react2.default.cloneElement(element, props, element.props.children);
            }
        },
        {
            key: "renderHeader",
            value: function renderHeader(header, i) {
                header.key = i;
                header.onSort = this.onSort;
                header.allRowsSelected = this.state.selectAll;
                header.onSelectAll = this.selectAll;
                return _react2.default.createElement(_Header2.default, header);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this7 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var typeClasses = {
                    simple: _styles2.default.simple
                };

                var className = (0, _classnames2.default)([
                    _styles2.default.table,
                    typeClasses[this.props.type],
                    this.props.className
                ]);

                if (!this.props.data || (!this.props.data.length && this.props.showEmpty)) {
                    return (
                        this.emptyElement || _react2.default.createElement(_Empty2.default, null)
                    );
                }

                var rows = [];
                this.props.data.map(function(data, index) {
                    rows.push(
                        _this7.renderRow(
                            data,
                            data.id || index,
                            _this7.rowElement,
                            data.id || index
                        )
                    );
                    if (_this7.rowDetailsElement) {
                        rows.push(
                            _this7.renderRow(
                                data,
                                data.id || index,
                                _this7.rowDetailsElement,
                                "details-" + (data.id || index)
                            )
                        );
                    }
                });

                var header = null;
                if (this.props.showHeader) {
                    header = _react2.default.createElement(
                        "thead",
                        null,
                        _react2.default.createElement(
                            "tr",
                            null,
                            this.headers.map(this.renderHeader)
                        )
                    );
                }

                return _react2.default.createElement(
                    "table",
                    { className: className },
                    header,
                    _react2.default.createElement("tbody", null, rows)
                );
            }
        }
    ]);
    return Table;
})(_react2.default.Component);

Table.defaultProps = {
    formSkip: true, // tells Form to stop descending into this element's children when looking for form components
    data: [],
    type: "simple",
    onSelect: null,
    selectedRows: [],
    sorters: {},
    showHeader: true,
    className: null
};

exports.default = (0, _webinyApp.createComponent)(Table, { styles: _styles2.default });
//# sourceMappingURL=Table.js.map
