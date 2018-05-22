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

var _LayoutWidget = require("./LayoutWidget");

var _LayoutWidget2 = _interopRequireDefault(_LayoutWidget);

var _LayoutSelector = require("./LayoutSelector");

var _LayoutSelector2 = _interopRequireDefault(_LayoutSelector);

var _LayoutContent = require("./LayoutContent.scss?");

var _LayoutContent2 = _interopRequireDefault(_LayoutContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LayoutContent = (function(_React$Component) {
    (0, _inherits3.default)(LayoutContent, _React$Component);

    function LayoutContent(props) {
        (0, _classCallCheck3.default)(this, LayoutContent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (LayoutContent.__proto__ || Object.getPrototypeOf(LayoutContent)).call(this)
        );

        _this.state = {};
        _this.cms = props.services.cms;
        _this.addLayoutWidget = _this.addLayoutWidget.bind(_this);
        _this.removeWidget = _this.removeWidget.bind(_this);
        _this.renderWidget = _this.renderWidget.bind(_this);
        _this.swapWidgets = _this.swapWidgets.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(LayoutContent, [
        {
            key: "addLayoutWidget",
            value: function addLayoutWidget(widget, position) {
                var _props = this.props,
                    value = _props.value,
                    onChange = _props.onChange;

                if (!value) {
                    value = [];
                }

                value.splice(
                    position,
                    0,
                    (0, _merge3.default)({ data: {} }, widget, { id: _shortid2.default.generate() })
                );

                onChange(value);
            }
        },
        {
            key: "removeWidget",
            value: function removeWidget(_ref) {
                var id = _ref.id;

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
                var _this2 = this;

                var widget = (0, _cloneDeep3.default)(data);

                var functions = {
                    moveUp: function moveUp() {
                        return _this2.swapWidgets(index, index - 1);
                    },
                    onRemoved: function onRemoved() {
                        return _this2.removeWidget({ widget: widget });
                    },
                    moveDown: function moveDown() {
                        return _this2.swapWidgets(index, index + 1);
                    }
                };

                console.log("render", widget);

                return _react2.default.createElement(_LayoutWidget2.default, {
                    key: widget.id,
                    widget: widget,
                    functions: functions,
                    onChange: function onChange(data) {
                        return _this2.onWidgetChange(widget, data);
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props2 = this.props,
                    _props2$modules = _props2.modules,
                    Button = _props2$modules.Button,
                    Grid = _props2$modules.Grid,
                    Tabs = _props2$modules.Tabs,
                    ViewSwitcher = _props2$modules.ViewSwitcher,
                    Modal = _props2$modules.Modal,
                    value = _props2.value;

                return _react2.default.createElement(
                    ViewSwitcher,
                    {
                        onReady: function onReady(actions) {
                            return (_this3.viewSwitcher = actions);
                        }
                    },
                    _react2.default.createElement(
                        ViewSwitcher.View,
                        { name: "content", defaultView: true },
                        function() {
                            return _react2.default.createElement(
                                _react2.default.Fragment,
                                null,
                                _react2.default.createElement(
                                    Tabs,
                                    null,
                                    _react2.default.createElement(
                                        Tabs.Tab,
                                        { label: "Layout" },
                                        !value.length &&
                                            _react2.default.createElement(
                                                _LayoutSelector2.default,
                                                {
                                                    onSelect: _this3.addLayoutWidget,
                                                    position: 0
                                                }
                                            ),
                                        value.length > 0 &&
                                            _react2.default.createElement(
                                                Grid.Row,
                                                null,
                                                _react2.default.createElement(
                                                    Grid.Col,
                                                    { all: 12 },
                                                    value &&
                                                        value.map(function(w, i) {
                                                            return _react2.default.createElement(
                                                                _react2.default.Fragment,
                                                                { key: i },
                                                                _this3.renderWidget(w, i),
                                                                _react2.default.createElement(
                                                                    _LayoutSelector2.default,
                                                                    {
                                                                        onSelect:
                                                                            _this3.addLayoutWidget,
                                                                        position: i + 1
                                                                    }
                                                                )
                                                            );
                                                        })
                                                )
                                            )
                                    )
                                ),
                                _react2.default.createElement(
                                    "pre",
                                    null,
                                    JSON.stringify(_this3.props.form.state.model, null, 2)
                                )
                            );
                        }
                    )
                );
            }
        }
    ]);
    return LayoutContent;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(LayoutContent, {
    modules: ["Alert", "Button", "Grid", "Tabs", "ViewSwitcher", "Modal"],
    services: ["cms"]
});
//# sourceMappingURL=LayoutContent.js.map
