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

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _WidgetsModal = require("./WidgetsModal");

var _WidgetsModal2 = _interopRequireDefault(_WidgetsModal);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _WidgetContainer = require("./../../../../components/WidgetContainer");

var _WidgetContainer2 = _interopRequireDefault(_WidgetContainer);

var _Widget = require("./Widget.scss?prefix=Webiny_CMS_Row_Widget");

var _Widget2 = _interopRequireDefault(_Widget);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowWidget = (function(_React$Component) {
    (0, _inherits3.default)(RowWidget, _React$Component);

    function RowWidget(_ref) {
        var services = _ref.services;
        (0, _classCallCheck3.default)(this, RowWidget);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (RowWidget.__proto__ || Object.getPrototypeOf(RowWidget)).call(this)
        );

        _this.state = {};
        _this.cms = services.cms;

        _this.addWidget = _this.addWidget.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(RowWidget, [
        {
            key: "addWidget",
            value: function addWidget(data) {
                var _props = this.props,
                    widget = _props.widget,
                    onChange = _props.onChange;

                widget.data[this.state.blockIndex].widget = (0, _merge3.default)(
                    { data: {} },
                    data
                );

                onChange(widget.data);
            }
        },
        {
            key: "renderWidget",
            value: function renderWidget(data, index) {
                var _this2 = this;

                var widget = (0, _cloneDeep3.default)(data);

                var editorWidget = this.cms.getEditorWidget(widget.type);
                if (!editorWidget) {
                    return null;
                }

                // Render widgetContainer using the the widget plugin
                var widgetContainer = editorWidget.widget.renderWidget({
                    WidgetContainer: _WidgetContainer2.default,
                    widget: widget
                });

                // Clone the widget container to pass new props to it
                return _react2.default.cloneElement(widgetContainer, {
                    widget: widget,
                    onChange: function onChange(model) {
                        _this2.props.widget.data[index].widget.data = model;
                        _this2.props.onChange(_this2.props.widget.data);
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
                    Grid = _props2$modules.Grid,
                    Icon = _props2$modules.Icon,
                    widget = _props2.widget;

                return _react2.default.createElement(
                    Grid.Row,
                    null,
                    _react2.default.createElement(_WidgetsModal2.default, {
                        name: "widgetsModal",
                        wide: true,
                        onSelect: function onSelect(data) {
                            return _this3.addWidget(data);
                        },
                        onReady: function onReady(dialog) {
                            return (_this3.widgetsModal = dialog);
                        }
                    }),
                    widget.data.map(function(_ref2, index) {
                        var grid = _ref2.grid,
                            widget = _ref2.widget;
                        return _react2.default.createElement(
                            Grid.Col,
                            { key: index, md: grid },
                            _react2.default.createElement(
                                "div",
                                {
                                    className: (0, _classnames2.default)(
                                        _Widget2.default.editorItem,
                                        widget && _Widget2.default.editorItemBlock
                                    )
                                },
                                !widget &&
                                    _react2.default.createElement(
                                        "span",
                                        {
                                            className: _Widget2.default.addBtn,
                                            onClick: function onClick() {
                                                return _this3.setState(
                                                    { blockIndex: index },
                                                    _this3.widgetsModal.show
                                                );
                                            }
                                        },
                                        _react2.default.createElement(Icon, {
                                            icon: "plus-circle",
                                            size: "2x"
                                        }),
                                        " ",
                                        _react2.default.createElement(
                                            "span",
                                            { className: _Widget2.default.txt },
                                            "ADD CONTENT"
                                        )
                                    ),
                                widget && _this3.renderWidget(widget, index)
                            )
                        );
                    })
                );
            }
        }
    ]);
    return RowWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(RowWidget, {
    modules: ["Grid", "Link", "Icon"],
    services: ["cms"]
});
//# sourceMappingURL=Widget.js.map
