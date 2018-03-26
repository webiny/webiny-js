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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _ExportTranslationsModal = require("./TranslationsList/ExportTranslationsModal");

var _ExportTranslationsModal2 = _interopRequireDefault(_ExportTranslationsModal);

var _ImportTranslationsModal = require("./TranslationsList/ImportTranslationsModal");

var _ImportTranslationsModal2 = _interopRequireDefault(_ImportTranslationsModal);

var _TextRow = require("./TranslationsList/TextRow");

var _TextRow2 = _interopRequireDefault(_TextRow);

var _TranslatedTextPercentages = require("./TranslationsList/TranslatedTextPercentages");

var _TranslatedTextPercentages2 = _interopRequireDefault(_TranslatedTextPercentages);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.TranslationsList
 */
var TranslationsList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(TranslationsList, _Webiny$Ui$View);

    function TranslationsList() {
        (0, _classCallCheck3.default)(this, TranslationsList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (TranslationsList.__proto__ || Object.getPrototypeOf(TranslationsList)).call(this)
        );

        _this.ref = null;
        _this.state = { locales: null };
        return _this;
    }

    (0, _createClass3.default)(TranslationsList, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    TranslationsList.prototype.__proto__ ||
                        Object.getPrototypeOf(TranslationsList.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                _webinyClient.Webiny.I18n.getLocales().then(function(locales) {
                    return _this2.setState({ locales: locales });
                });
            }
        }
    ]);
    return TranslationsList;
})(_webinyClient.Webiny.Ui.View);

TranslationsList.defaultProps = {
    renderer: function renderer() {
        var _this3 = this;

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
                    "Form",
                    "Grid",
                    "Select",
                    "Alert",
                    "Link"
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
                                        title: _this3.i18n("Translations"),
                                        description: _this3.i18n(
                                            "Manage translations for {linkToTextsSection} in all installed apps.",
                                            {
                                                linkToTextsSection: _react2.default.createElement(
                                                    Ui.Link,
                                                    { route: "I18N.Texts.List" },
                                                    _this3.i18n("texts")
                                                )
                                            }
                                        )
                                    },
                                    _react2.default.createElement(
                                        Ui.ButtonGroup,
                                        null,
                                        _react2.default.createElement(Ui.Button, {
                                            type: "primary",
                                            onClick: showView("importTranslationsModal"),
                                            icon: "fa-download",
                                            label: _this3.i18n("Import")
                                        }),
                                        _react2.default.createElement(Ui.Button, {
                                            type: "secondary",
                                            onClick: showView("exportTranslationsModal"),
                                            icon: "fa-upload",
                                            label: _this3.i18n("Export")
                                        })
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.View.Body,
                                    null,
                                    _lodash2.default.isArray(_this3.state.locales) &&
                                    _lodash2.default.isEmpty(_this3.state.locales)
                                        ? _react2.default.createElement(
                                              Ui.Alert,
                                              null,
                                              _this3.i18n(
                                                  "Before editing translations, header over to {locales} section and create a locale.",
                                                  {
                                                      locales: _react2.default.createElement(
                                                          Ui.Link,
                                                          { route: "I18N.Locales.List" },
                                                          _this3.i18n("Locales")
                                                      )
                                                  }
                                              )
                                          )
                                        : _react2.default.createElement(
                                              _TranslatedTextPercentages2.default,
                                              null
                                          ),
                                    _react2.default.createElement(
                                        Ui.List,
                                        {
                                            ref: function ref(_ref4) {
                                                return (_this3.ref = _ref4);
                                            },
                                            connectToRouter: true,
                                            title: _this3.i18n("Translations"),
                                            api: "/entities/webiny/i18n-texts",
                                            searchFields: "key,base,app,translations.text",
                                            fields: "key,base,translations",
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
                                                            placeholder: _this3.i18n(
                                                                "Search by key, text or translation"
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
                                                            placeholder: _this3.i18n(
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
                                                            placeholder: _this3.i18n(
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
                                                    { label: _this3.i18n("Text"), align: "left" },
                                                    function(_ref3) {
                                                        var data = _ref3.data;
                                                        return _react2.default.createElement(
                                                            _TextRow2.default,
                                                            {
                                                                locales: _this3.state.locales,
                                                                text: data
                                                            }
                                                        );
                                                    }
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
                        { view: "exportTranslationsModal", modal: true },
                        function(_ref5) {
                            var showView = _ref5.showView,
                                data = _ref5.data.data;
                            return _react2.default.createElement(
                                _ExportTranslationsModal2.default,
                                { showView: showView, data: data }
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "importTranslationsModal", modal: true },
                        function(_ref6) {
                            var showView = _ref6.showView,
                                data = _ref6.data.data;
                            return _react2.default.createElement(
                                _ImportTranslationsModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onTranslationsImported: function onTranslationsImported() {
                                            return _this3.ref.loadData();
                                        }
                                    }
                                )
                            );
                        }
                    )
                );
            }
        );
    }
};

exports.default = TranslationsList;
//# sourceMappingURL=TranslationsList.js.map
