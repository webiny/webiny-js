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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _ErrorGroup = require("./ErrorGroup");

var _ErrorGroup2 = _interopRequireDefault(_ErrorGroup);

var _ErrorCount = require("./ErrorCount");

var _ErrorCount2 = _interopRequireDefault(_ErrorCount);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Logger.ListErrors
 */
var ListErrors = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ListErrors, _Webiny$Ui$View);

    function ListErrors(props) {
        (0, _classCallCheck3.default)(this, ListErrors);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ListErrors.__proto__ || Object.getPrototypeOf(ListErrors)).call(this, props)
        );

        _this.bindMethods("resolveError");

        _this.state = {};
        return _this;
    }

    (0, _createClass3.default)(ListErrors, [
        {
            key: "resolveGroup",
            value: function resolveGroup(error, list) {
                var api = new _webinyClient.Webiny.Api.Endpoint(
                    "/entities/webiny/logger-error-group"
                );
                api.delete(error.id).then(function() {
                    list.loadData();
                });
            }
        },
        {
            key: "resolveError",
            value: function resolveError(error, list, parentList) {
                var _this2 = this;

                var api = new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/logger-entry");
                api.post(error.id + "/resolve").then(function(response) {
                    if (response.getData("errorCount") < 1) {
                        // if we have 0 errors in this group, we have to refresh the parent table
                        parentList.loadData();
                    } else {
                        list.loadData();
                        _this2["errorCount-" + response.getData("errorGroup")].updateCount(
                            response.getData("errorCount")
                        );
                    }
                });
            }
        }
    ]);
    return ListErrors;
})(_webinyClient.Webiny.Ui.View);

ListErrors.defaultProps = {
    renderer: function renderer() {
        var _this3 = this;

        var jsErrorList = {
            api: "/entities/webiny/logger-error-group",
            fields: "*",
            searchFields: "error",
            query: { _sort: "-lastEntry", type: this.props.type },
            layout: null
        };

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["List", "Section", "Grid", "ExpandableList", "Filters"] },
            function(Ui) {
                return _react2.default.createElement(Ui.List, jsErrorList, function(_ref) {
                    var list = _ref.list,
                        meta = _ref.meta,
                        errorList = _ref.$this;

                    return _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.Section, {
                                title: _this3.i18n(
                                    "Found a total of {total} records (showing {perPage} per page)",
                                    {
                                        total: meta.totalCount,
                                        perPage: meta.perPage
                                    }
                                )
                            })
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.List.Loader, null),
                            _react2.default.createElement(Ui.List.Table.Empty, {
                                renderIf: !list.length
                            }),
                            _react2.default.createElement(
                                Ui.ExpandableList,
                                null,
                                list.map(function(row) {
                                    return _react2.default.createElement(
                                        Ui.ExpandableList.Row,
                                        { key: row.id },
                                        _react2.default.createElement(
                                            Ui.ExpandableList.Field,
                                            { width: 1, name: "Count", className: "text-center" },
                                            _react2.default.createElement(_ErrorCount2.default, {
                                                count: row.errorCount,
                                                ref: function ref(_ref2) {
                                                    return (_this3["errorCount-" + row.id] = _ref2);
                                                }
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.Field,
                                            {
                                                width: 5,
                                                name: "Error"
                                            },
                                            row.error
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.Field,
                                            { width: 4, name: "Last Entry" },
                                            _react2.default.createElement(Ui.Filters.DateTime, {
                                                value: row.lastEntry
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.RowDetailsList,
                                            { title: row.error },
                                            _react2.default.createElement(_ErrorGroup2.default, {
                                                errorGroup: row,
                                                resolveError: _this3.resolveError,
                                                parentList: errorList
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.ActionSet,
                                            null,
                                            _react2.default.createElement(
                                                Ui.ExpandableList.Action,
                                                {
                                                    label: _this3.i18n("Resolve Group"),
                                                    icon: "icon-check",
                                                    onClick: function onClick() {
                                                        return _this3.resolveGroup(row, errorList);
                                                    }
                                                }
                                            )
                                        )
                                    );
                                })
                            )
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.List.Pagination, null)
                        )
                    );
                });
            }
        );
    }
};

exports.default = ListErrors;
//# sourceMappingURL=ListErrors.js.map
