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

var _LocalesModal = require("./LocalesList/LocalesModal");

var _LocalesModal2 = _interopRequireDefault(_LocalesModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.LocalesList
 */
var LocalesList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(LocalesList, _Webiny$Ui$View);

    function LocalesList() {
        (0, _classCallCheck3.default)(this, LocalesList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (LocalesList.__proto__ || Object.getPrototypeOf(LocalesList)).call(this)
        );

        _this.localesModal = null;
        _this.localesList = null;
        return _this;
    }

    return LocalesList;
})(_webinyClient.Webiny.Ui.View);

LocalesList.defaultProps = {
    renderer: function render() {
        var _this2 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["View", "List", "Icon", "Button", "ViewSwitcher"] },
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
                                    { title: _this2.i18n("I18N - Locales") },
                                    _react2.default.createElement(
                                        Ui.Button,
                                        {
                                            type: "primary",
                                            align: "right",
                                            onClick: showView("localesModal")
                                        },
                                        _react2.default.createElement(Ui.Icon, {
                                            icon: "icon-plus-circled"
                                        }),
                                        _this2.i18n("Add Locale")
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.View.Body,
                                    null,
                                    _react2.default.createElement(
                                        Ui.List,
                                        {
                                            sort: "-createdOn",
                                            connectToRouter: true,
                                            api: "/entities/webiny/i18n-locales",
                                            fields: "id,enabled,default,label,key,createdOn",
                                            searchFields: "id,key",
                                            ref: function ref(_ref3) {
                                                return (_this2.localesList = _ref3);
                                            }
                                        },
                                        _react2.default.createElement(
                                            Ui.List.Table,
                                            null,
                                            _react2.default.createElement(
                                                Ui.List.Table.Row,
                                                null,
                                                _react2.default.createElement(
                                                    Ui.List.Table.Field,
                                                    { label: _this2.i18n("Locale"), sort: "key" },
                                                    function(_ref2) {
                                                        var data = _ref2.data;

                                                        return _react2.default.createElement(
                                                            "div",
                                                            null,
                                                            _react2.default.createElement(
                                                                "div",
                                                                null,
                                                                data.label
                                                            ),
                                                            _react2.default.createElement(
                                                                "code",
                                                                null,
                                                                data.key
                                                            )
                                                        );
                                                    }
                                                ),
                                                _react2.default.createElement(
                                                    Ui.List.Table.ToggleField,
                                                    {
                                                        name: "enabled",
                                                        label: _this2.i18n("Enabled"),
                                                        sort: "enabled",
                                                        align: "center"
                                                    }
                                                ),
                                                _react2.default.createElement(
                                                    Ui.List.Table.ToggleField,
                                                    {
                                                        name: "default",
                                                        label: _this2.i18n("Default"),
                                                        sort: "default",
                                                        align: "center"
                                                    }
                                                ),
                                                _react2.default.createElement(
                                                    Ui.List.Table.DateField,
                                                    {
                                                        name: "createdOn",
                                                        label: _this2.i18n("Created On"),
                                                        sort: "createdOn",
                                                        align: "center"
                                                    }
                                                ),
                                                _react2.default.createElement(
                                                    Ui.List.Table.Actions,
                                                    null,
                                                    _react2.default.createElement(
                                                        Ui.List.Table.EditAction,
                                                        { onClick: showView("localesModal") }
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
                        { view: "localesModal", modal: true },
                        function(_ref4) {
                            var showView = _ref4.showView,
                                data = _ref4.data.data;
                            return _react2.default.createElement(
                                _LocalesModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onSubmitSuccess: function onSubmitSuccess() {
                                            return _this2.localesList.loadData();
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

exports.default = LocalesList;
//# sourceMappingURL=LocalesList.js.map
