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

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _shortid = require("shortid");

var _shortid2 = _interopRequireDefault(_shortid);

var _WidgetsModal = require("./WidgetsModal");

var _WidgetsModal2 = _interopRequireDefault(_WidgetsModal);

var _Widget = require("./Widget");

var _Widget2 = _interopRequireDefault(_Widget);

var _PageContent = require("./PageContent.scss?");

var _PageContent2 = _interopRequireDefault(_PageContent);

var _MakeGlobalDialog = require("./MakeGlobalDialog");

var _MakeGlobalDialog2 = _interopRequireDefault(_MakeGlobalDialog);

var _PageContentPreview = require("./../PageContentPreview");

var _PageContentPreview2 = _interopRequireDefault(_PageContentPreview);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageContent = (function(_React$Component) {
    (0, _inherits3.default)(PageContent, _React$Component);

    function PageContent(props) {
        (0, _classCallCheck3.default)(this, PageContent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageContent.__proto__ || Object.getPrototypeOf(PageContent)).call(this)
        );

        _this.state = {};
        _this.cms = props.services.cms;
        _this.addWidget = _this.addWidget.bind(_this);
        _this.removeWidget = _this.removeWidget.bind(_this);
        _this.beforeRemoveWidget = _this.beforeRemoveWidget.bind(_this);
        _this.swapWidgets = _this.swapWidgets.bind(_this);
        _this.toggleScope = _this.toggleScope.bind(_this);
        _this.makeWidgetLocal = _this.makeWidgetLocal.bind(_this);
        _this.makeWidgetGlobal = _this.makeWidgetGlobal.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(PageContent, [
        {
            key: "addWidget",
            value: function addWidget(widget) {
                var _props = this.props,
                    value = _props.value,
                    onChange = _props.onChange;

                if (!value) {
                    value = [];
                }

                value.push(
                    (0, _merge3.default)({ data: {} }, widget, { id: _shortid2.default.generate() })
                );

                onChange(value);
            }
        },
        {
            key: "beforeRemoveWidget",
            value: function beforeRemoveWidget(_ref) {
                var widget = _ref.widget;

                var editorWidget = this.cms.getEditorWidget(widget.type);
                if (typeof editorWidget.removeWidget === "function" && !widget.origin) {
                    return editorWidget.removeWidget(widget);
                }
                return Promise.resolve();
            }
        },
        {
            key: "removeWidget",
            value: function removeWidget(_ref2) {
                var id = _ref2.id;

                var widgets = (0, _cloneDeep3.default)(this.props.value);
                widgets.splice((0, _findIndex3.default)(widgets, { id: id }), 1);
                this.props.onChange(widgets);
            }
        },
        {
            key: "swapWidgets",
            value: function swapWidgets(a, b) {
                var count = this.props.value.length;
                if (count === 1 || b === count || b === -1) {
                    return;
                }

                var widgets = (0, _cloneDeep3.default)(this.props.value);
                widgets.splice(b, 1, widgets.splice(a, 1, widgets[b])[0]);
                this.props.onChange(widgets);
            }
        },
        {
            key: "toggleScope",
            value: function toggleScope(data) {
                var _this2 = this;

                this.setState({ toggleScope: data }, function() {
                    data.origin ? _this2.makeLocalDialog.show() : _this2.makeGlobalDialog.show();
                });
            }
        },
        {
            key: "makeWidgetLocal",
            value: function makeWidgetLocal(global) {
                // Make widget global
                var localWidget = (0, _pick3.default)(global, ["id", "type", "data", "settings"]);
                var widgets = (0, _cloneDeep3.default)(this.props.value);
                widgets.splice(
                    (0, _findIndex3.default)(widgets, { id: global.id }),
                    1,
                    localWidget
                );
                this.props.onChange(widgets);
            }
        },
        {
            key: "makeWidgetGlobal",
            value: function makeWidgetGlobal(local, origin) {
                var widgets = (0, _cloneDeep3.default)(this.props.value);
                widgets.splice(
                    (0, _findIndex3.default)(widgets, { id: local.id }),
                    1,
                    (0, _merge3.default)({}, local, { origin: origin })
                );

                // Propagate changes
                this.props.onChange(widgets);
            }
        },
        {
            key: "deleteGlobalWidget",
            value: function deleteGlobalWidget(id) {
                return this.cms.deleteGlobalWidget(id);
            }
        },
        {
            key: "onWidgetChange",
            value: function onWidgetChange(widget, update) {
                var value = this.props.value;
                var data = update.data,
                    settings = update.settings,
                    __dirty = update.__dirty;

                var newWidget = Object.assign({}, widget, {
                    __dirty: __dirty
                });

                if (data !== undefined) {
                    newWidget["data"] = data;
                }

                if (settings !== undefined) {
                    newWidget["settings"] = settings;
                }

                value[(0, _findIndex3.default)(value, { id: widget.id })] = newWidget;

                this.props.onChange(value);
            }
        },
        {
            key: "renderWidget",
            value: function renderWidget(data, index) {
                var _this3 = this;

                var Alert = this.props.modules.Alert;

                var widget = (0, _cloneDeep3.default)(data);

                var functions = {
                    moveUp: function moveUp() {
                        return _this3.swapWidgets(index, index - 1);
                    },
                    toggleScope: function toggleScope() {
                        return _this3.viewSwitcher.showView("toggleScope")(widget);
                    },
                    beforeRemove: function beforeRemove() {
                        return _this3.beforeRemoveWidget({ widget: widget });
                    },
                    onRemoved: function onRemoved() {
                        return _this3.removeWidget({ widget: widget });
                    },
                    moveDown: function moveDown() {
                        return _this3.swapWidgets(index, index + 1);
                    }
                };

                if (widget.origin) {
                    var wd = this.cms.getEditorWidget(widget.type, { origin: widget.origin });
                    if (!wd) {
                        return _react2.default.createElement(
                            Alert,
                            { key: widget.id, type: "danger" },
                            "Missing widget for type ",
                            _react2.default.createElement("strong", null, widget.type)
                        );
                    }
                    if (!widget.data) {
                        widget.data = (0, _cloneDeep3.default)(wd.data);
                    }

                    if (!widget.settings) {
                        widget.settings = (0, _cloneDeep3.default)(wd.settings);
                    }
                }

                return _react2.default.createElement(_Widget2.default, {
                    key: widget.id,
                    widget: widget,
                    functions: functions,
                    onChange: function onChange(data) {
                        return _this3.onWidgetChange(widget, data);
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                var _props2 = this.props,
                    _props2$modules = _props2.modules,
                    Button = _props2$modules.Button,
                    Grid = _props2$modules.Grid,
                    Tabs = _props2$modules.Tabs,
                    ViewSwitcher = _props2$modules.ViewSwitcher,
                    Modal = _props2$modules.Modal,
                    value = _props2.value;

                var addContent = _react2.default.createElement(
                    Grid.Row,
                    null,
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 12, style: { textAlign: "center" } },
                        _react2.default.createElement(
                            Button,
                            {
                                type: "primary",
                                icon: ["fas", "plus-circle"],
                                onClick: function onClick() {
                                    return _this4.pluginsModal.show();
                                }
                            },
                            "Add content"
                        ),
                        _react2.default.createElement(_WidgetsModal2.default, {
                            name: "pluginsModal",
                            wide: true,
                            onSelect: this.addWidget,
                            onDelete: function onDelete(widget) {
                                return _this4.viewSwitcher.showView("deleteGlobalWidget")(widget);
                            },
                            onReady: function onReady(dialog) {
                                return (_this4.pluginsModal = dialog);
                            }
                        })
                    )
                );

                return _react2.default.createElement(
                    ViewSwitcher,
                    {
                        onReady: function onReady(actions) {
                            return (_this4.viewSwitcher = actions);
                        }
                    },
                    _react2.default.createElement(
                        ViewSwitcher.View,
                        { name: "content", defaultView: true },
                        function() {
                            return _react2.default.createElement(
                                _react2.default.Fragment,
                                null,
                                !value.length &&
                                    _react2.default.createElement(
                                        _react2.default.Fragment,
                                        null,
                                        _react2.default.createElement(
                                            "p",
                                            { style: { textAlign: "center", marginTop: 30 } },
                                            "To begin editing your page click the big button :)",
                                            " "
                                        ),
                                        addContent
                                    ),
                                value.length > 0 &&
                                    _react2.default.createElement(
                                        _react2.default.Fragment,
                                        null,
                                        addContent,
                                        _react2.default.createElement(
                                            Grid.Row,
                                            null,
                                            _react2.default.createElement(
                                                Grid.Col,
                                                { all: 6 },
                                                _react2.default.createElement(
                                                    "div",
                                                    {
                                                        className:
                                                            _PageContent2.default.editorContent
                                                    },
                                                    value &&
                                                        value.map(_this4.renderWidget.bind(_this4))
                                                )
                                            ),
                                            _react2.default.createElement(
                                                Grid.Col,
                                                { all: 6 },
                                                _react2.default.createElement(
                                                    "div",
                                                    {
                                                        className:
                                                            _PageContent2.default.editorContent,
                                                        style: { padding: 0, border: 0 }
                                                    },
                                                    _react2.default.createElement(
                                                        Tabs,
                                                        null,
                                                        _react2.default.createElement(
                                                            Tabs.Tab,
                                                            { label: "Preview" },
                                                            value &&
                                                                _react2.default.createElement(
                                                                    _PageContentPreview2.default,
                                                                    {
                                                                        content: (0,
                                                                        _cloneDeep3.default)(value)
                                                                    }
                                                                )
                                                        ),
                                                        _react2.default.createElement(
                                                            Tabs.Tab,
                                                            { label: "Model" },
                                                            _react2.default.createElement(
                                                                "pre",
                                                                null,
                                                                JSON.stringify(
                                                                    _this4.props.form.state.model,
                                                                    null,
                                                                    2
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        ViewSwitcher.View,
                        { name: "toggleScope", modal: true },
                        function(_ref3) {
                            var data = _ref3.data;

                            if (data.origin) {
                                return _react2.default.createElement(Modal.Confirmation, {
                                    name: "makeLocal",
                                    confirm: "Ok, make it local!",
                                    cancel: "Not now",
                                    message: _react2.default.createElement(
                                        "span",
                                        null,
                                        "You are about to make this widget local.",
                                        _react2.default.createElement("br", null),
                                        _react2.default.createElement("br", null),
                                        "Note that after this action this widget will no longer be affected by the changes you make to the global widget it originates from!"
                                    ),
                                    onConfirm: function onConfirm() {
                                        return _this4.makeWidgetLocal(data);
                                    }
                                });
                            }

                            return _react2.default.createElement(_MakeGlobalDialog2.default, {
                                name: "makeGlobal",
                                widget: data,
                                onSuccess: function onSuccess(widget) {
                                    return _this4.makeWidgetGlobal(data, widget);
                                }
                            });
                        }
                    ),
                    _react2.default.createElement(
                        ViewSwitcher.View,
                        { name: "deleteGlobalWidget", modal: true },
                        function(_ref4) {
                            var data = _ref4.data;

                            return _react2.default.createElement(Modal.Confirmation, {
                                name: "deleteGlobalWidget",
                                confirm: "I know what I'm doing!",
                                cancel: "I changed my mind",
                                message: _react2.default.createElement(
                                    "span",
                                    null,
                                    "You are about to delete a global widget!",
                                    _react2.default.createElement("br", null),
                                    _react2.default.createElement("br", null),
                                    "Note that this will affect all the pages that are currently using this widget!"
                                ),
                                onConfirm: function onConfirm() {
                                    return _this4.deleteGlobalWidget(data.origin);
                                }
                            });
                        }
                    )
                );
            }
        }
    ]);
    return PageContent;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageContent, {
    modules: ["Alert", "Button", "Grid", "Tabs", "ViewSwitcher", "Modal"],
    services: ["cms"]
});
//# sourceMappingURL=PageContent.js.map
