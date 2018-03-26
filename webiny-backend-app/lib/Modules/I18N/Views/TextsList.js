"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _TextsModal = require("./TextsList/TextsModal");

var _TextsModal2 = _interopRequireDefault(_TextsModal);

var _ScanTextsModal = require("./TextsList/ScanTextsModal");

var _ScanTextsModal2 = _interopRequireDefault(_ScanTextsModal);

var _ImportTextsModal = require("./TextsList/ImportTextsModal");

var _ImportTextsModal2 = _interopRequireDefault(_ImportTextsModal);

var _ExportTextsModal = require("./TextsList/ExportTextsModal");

var _ExportTextsModal2 = _interopRequireDefault(_ExportTextsModal);

var _TextsList = require("./TextsList.scss");

var _TextsList2 = _interopRequireDefault(_TextsList);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.TextsList
 */
var TextsList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(TextsList, _Webiny$Ui$View);

    function TextsList() {
        (0, _classCallCheck3.default)(this, TextsList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (TextsList.__proto__ || Object.getPrototypeOf(TextsList)).call(this)
        );

        _this.ref = null;
        return _this;
    }

    return TextsList;
})(_webinyClient.Webiny.Ui.View);

TextsList.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            {
                modules: [
                    "ViewSwitcher",
                    "View",
                    "Button",
                    "ButtonGroup",
                    "Icon",
                    "List",
                    "Input",
                    "Link",
                    "Grid",
                    "Select"
                ]
            },
            function(Ui) {
                return _react2.default.createElement(
                    Ui.ViewSwitcher,
                    null,
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "translationsList", defaultView: true },
                        function(_ref) {
                            var showView = _ref.showView;
                            return _react2.default.createElement(
                                Ui.View.List,
                                null,
                                _react2.default.createElement(
                                    Ui.View.Header,
                                    {
                                        title: _this2.i18n("Texts"),
                                        description: _this2.i18n(
                                            "Scan, create and manage existing texts in all installed apps."
                                        )
                                    },
                                    _react2.default.createElement(
                                        Ui.ButtonGroup,
                                        null,
                                        _react2.default.createElement(Ui.Button, {
                                            type: "primary",
                                            onClick: showView("textsModal"),
                                            icon: "icon-plus-circled",
                                            label: _this2.i18n("Create")
                                        }),
                                        _react2.default.createElement(Ui.Button, {
                                            type: "secondary",
                                            onClick: showView("importTextsModal"),
                                            icon: "fa-download",
                                            label: _this2.i18n("Import")
                                        }),
                                        _react2.default.createElement(Ui.Button, {
                                            type: "secondary",
                                            onClick: showView("exportTextsModal"),
                                            icon: "fa-upload",
                                            label: _this2.i18n("Export")
                                        }),
                                        _react2.default.createElement(Ui.Button, {
                                            type: "secondary",
                                            icon: "icon-arrow-circle-right",
                                            onClick: showView("scanTextsModal"),
                                            label: _this2.i18n("Scan")
                                        })
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.View.Body,
                                    null,
                                    _react2.default.createElement(
                                        Ui.List,
                                        {
                                            ref: function ref(_ref4) {
                                                return (_this2.ref = _ref4);
                                            },
                                            connectToRouter: true,
                                            title: _this2.i18n("Translations"),
                                            api: "/entities/webiny/i18n-texts",
                                            searchFields: "key,base",
                                            fields: "key,base,app,translations,group,createdOn",
                                            sort: "-createdOn"
                                        },
                                        _react2.default.createElement(
                                            Ui.List.FormFilters,
                                            null,
                                            function(_ref2) {
                                                var apply = _ref2.apply;
                                                return _react2.default.createElement(
                                                    Ui.Grid.Row,
                                                    null,
                                                    _react2.default.createElement(
                                                        Ui.Grid.Col,
                                                        { all: 4 },
                                                        _react2.default.createElement(Ui.Input, {
                                                            name: "_searchQuery",
                                                            placeholder: _this2.i18n(
                                                                "Search by key or base text"
                                                            ),
                                                            onEnter: apply()
                                                        })
                                                    ),
                                                    _react2.default.createElement(
                                                        Ui.Grid.Col,
                                                        { all: 4 },
                                                        _react2.default.createElement(Ui.Select, {
                                                            name: "app",
                                                            api: "/services/webiny/apps",
                                                            url: "/installed",
                                                            textAttr: "name",
                                                            valueAttr: "name",
                                                            placeholder: _this2.i18n(
                                                                "Filter by app"
                                                            ),
                                                            allowClear: true,
                                                            onChange: apply()
                                                        })
                                                    ),
                                                    _react2.default.createElement(
                                                        Ui.Grid.Col,
                                                        { all: 4 },
                                                        _react2.default.createElement(Ui.Select, {
                                                            api:
                                                                "/entities/webiny/i18n-text-groups",
                                                            name: "group",
                                                            placeholder: _this2.i18n(
                                                                "Filter by text group"
                                                            ),
                                                            allowClear: true,
                                                            onChange: apply()
                                                        })
                                                    )
                                                );
                                            }
                                        ),
                                        _react2.default.createElement(
                                            Ui.List.Table,
                                            null,
                                            _react2.default.createElement(
                                                Ui.List.Table.Row,
                                                null,
                                                _react2.default.createElement(
                                                    Ui.List.Table.Field,
                                                    { label: _this2.i18n("Text"), align: "left" },
                                                    function(_ref3) {
                                                        var data = _ref3.data;
                                                        return _react2.default.createElement(
                                                            "div",
                                                            {
                                                                className:
                                                                    _TextsList2.default.textField
                                                            },
                                                            _react2.default.createElement(
                                                                "h1",
                                                                { className: "base" },
                                                                data.base
                                                            ),
                                                            _react2.default.createElement(
                                                                "code",
                                                                { className: "key" },
                                                                data.key
                                                            )
                                                        );
                                                    }
                                                ),
                                                _react2.default.createElement(Ui.List.Table.Field, {
                                                    name: "app",
                                                    label: _this2.i18n("App"),
                                                    align: "center"
                                                }),
                                                _react2.default.createElement(Ui.List.Table.Field, {
                                                    name: "group.name",
                                                    label: _this2.i18n("Group"),
                                                    align: "center"
                                                }),
                                                _react2.default.createElement(
                                                    Ui.List.Table.DateField,
                                                    {
                                                        name: "createdOn",
                                                        label: _this2.i18n("Created On"),
                                                        align: "center"
                                                    }
                                                ),
                                                _react2.default.createElement(
                                                    Ui.List.Table.Actions,
                                                    null,
                                                    _react2.default.createElement(
                                                        Ui.List.Table.EditAction,
                                                        { onClick: showView("textsModal") }
                                                    ),
                                                    _react2.default.createElement(
                                                        Ui.List.Table.DeleteAction,
                                                        null
                                                    )
                                                )
                                            ),
                                            _react2.default.createElement(
                                                Ui.List.Table.Footer,
                                                null
                                            )
                                        ),
                                        _react2.default.createElement(Ui.List.Pagination, null)
                                    )
                                )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "textsModal", modal: true },
                        function(_ref5) {
                            var showView = _ref5.showView,
                                data = _ref5.data.data;
                            return _react2.default.createElement(
                                _TextsModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onTextsSaved: function onTextsSaved() {
                                            return _this2.ref.loadData();
                                        }
                                    }
                                )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "scanTextsModal", modal: true },
                        function(_ref6) {
                            var showView = _ref6.showView,
                                data = _ref6.data.data;
                            return _react2.default.createElement(
                                _ScanTextsModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onTextsScanned: function onTextsScanned() {
                                            return _this2.ref.loadData();
                                        }
                                    }
                                )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "importTextsModal", modal: true },
                        function(_ref7) {
                            var showView = _ref7.showView,
                                data = _ref7.data.data;
                            return _react2.default.createElement(
                                _ImportTextsModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onTextsImported: function onTextsImported() {
                                            return _this2.ref.loadData();
                                        }
                                    }
                                )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "exportTextsModal", modal: true },
                        function(_ref8) {
                            var showView = _ref8.showView,
                                data = _ref8.data.data;
                            return _react2.default.createElement(_ExportTextsModal2.default, {
                                showView: showView,
                                data: data
                            });
                        }
                    )
                );
            }
        );
    }
};

exports.default = TextsList;
//# sourceMappingURL=TextsList.js.map
