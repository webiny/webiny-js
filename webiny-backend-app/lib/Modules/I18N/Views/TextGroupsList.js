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

var _TextGroupsModal = require("./TextGroupsList/TextGroupsModal");

var _TextGroupsModal2 = _interopRequireDefault(_TextGroupsModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.TextGroupsList
 */
var TextGroupsList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(TextGroupsList, _Webiny$Ui$View);

    function TextGroupsList() {
        (0, _classCallCheck3.default)(this, TextGroupsList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (TextGroupsList.__proto__ || Object.getPrototypeOf(TextGroupsList)).call(this)
        );

        _this.ref = null;
        return _this;
    }

    return TextGroupsList;
})(_webinyClient.Webiny.Ui.View);

TextGroupsList.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["ViewSwitcher", "View", "Button", "List"] },
            function(Ui) {
                return _react2.default.createElement(
                    Ui.ViewSwitcher,
                    null,
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "groupsList", defaultView: true },
                        function(_ref) {
                            var showView = _ref.showView;
                            return _react2.default.createElement(
                                Ui.View.List,
                                null,
                                _react2.default.createElement(
                                    Ui.View.Header,
                                    { title: _this2.i18n("Text Groups") },
                                    _react2.default.createElement(Ui.Button, {
                                        type: "primary",
                                        align: "right",
                                        onClick: showView("groupsModal"),
                                        icon: "icon-plus-circled",
                                        label: _this2.i18n("Create")
                                    })
                                ),
                                _react2.default.createElement(
                                    Ui.View.Body,
                                    null,
                                    _react2.default.createElement(
                                        Ui.List,
                                        {
                                            ref: function ref(_ref2) {
                                                return (_this2.ref = _ref2);
                                            },
                                            connectToRouter: true,
                                            title: _this2.i18n("Text Groups"),
                                            api: "/entities/webiny/i18n-text-groups",
                                            fields: "name,app,totalTexts,createdOn",
                                            sort: "-createdOn"
                                        },
                                        _react2.default.createElement(
                                            Ui.List.Table,
                                            null,
                                            _react2.default.createElement(
                                                Ui.List.Table.Row,
                                                null,
                                                _react2.default.createElement(Ui.List.Table.Field, {
                                                    name: "name",
                                                    label: _this2.i18n("Name")
                                                }),
                                                _react2.default.createElement(Ui.List.Table.Field, {
                                                    name: "app",
                                                    label: _this2.i18n("App"),
                                                    align: "center"
                                                }),
                                                _react2.default.createElement(
                                                    Ui.List.Table.NumberField,
                                                    {
                                                        name: "totalTexts",
                                                        label: _this2.i18n("Total Texts"),
                                                        align: "center"
                                                    }
                                                ),
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
                                                        { onClick: showView("groupsModal") }
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
                        { view: "groupsModal", modal: true },
                        function(_ref3) {
                            var showView = _ref3.showView,
                                data = _ref3.data.data;
                            return _react2.default.createElement(
                                _TextGroupsModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        onSubmitSuccess: function onSubmitSuccess() {
                                            return _this2.ref.loadData();
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

exports.default = TextGroupsList;
//# sourceMappingURL=TextGroupsList.js.map
