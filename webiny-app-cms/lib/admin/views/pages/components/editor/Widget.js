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

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _Widget = require("./Widget.scss?");

var _Widget2 = _interopRequireDefault(_Widget);

var _EditorWidget = require("./EditorWidget");

var _EditorWidget2 = _interopRequireDefault(_EditorWidget);

var _WidgetFunctions = require("./WidgetFunctions");

var _WidgetFunctions2 = _interopRequireDefault(_WidgetFunctions);

var _WidgetSettingsDialog = require("./WidgetSettingsDialog");

var _WidgetSettingsDialog2 = _interopRequireDefault(_WidgetSettingsDialog);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Widget = (function(_React$Component) {
    (0, _inherits3.default)(Widget, _React$Component);

    function Widget() {
        (0, _classCallCheck3.default)(this, Widget);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Widget.__proto__ || Object.getPrototypeOf(Widget)).call(this)
        );

        _this.applyGlobalWidgetChanges = _this.applyGlobalWidgetChanges.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Widget, [
        {
            key: "applyGlobalWidgetChanges",
            value: function applyGlobalWidgetChanges() {
                var _this2 = this;

                var _props$widget = this.props.widget,
                    data = _props$widget.data,
                    settings = _props$widget.settings,
                    origin = _props$widget.origin;

                this.props.services.cms
                    .updateGlobalWidget(origin, { data: data, settings: settings })
                    .then(function() {
                        _this2.props.onChange({ data: null, settings: null, __dirty: false });
                    });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props = this.props,
                    widget = _props.widget,
                    functions = _props.functions,
                    _onChange = _props.onChange,
                    _props$modules = _props.modules,
                    Link = _props$modules.Link,
                    Icon = _props$modules.Icon,
                    cms = _props.services.cms;

                var isGlobal = !!widget.origin;
                var isDirty = !!widget.__dirty;

                var editorWidget = cms.getEditorWidget(widget.type);
                if (!editorWidget) {
                    return null;
                }

                functions.showSettings = function() {
                    return _this3.settingsDialog.show();
                };

                return _react2.default.createElement(
                    "div",
                    {
                        className: (0, _classnames2.default)(
                            _Widget2.default.editorWidget,
                            isGlobal && _Widget2.default.globalWidget
                        )
                    },
                    _react2.default.createElement(
                        _react2.default.Fragment,
                        null,
                        _react2.default.createElement(_WidgetSettingsDialog2.default, {
                            name: widget.id + "-settings",
                            widget: widget,
                            isGlobal: isGlobal,
                            onChange: function onChange(model) {
                                return _onChange({
                                    settings: model,
                                    __dirty:
                                        isDirty || !(0, _isEqual3.default)(model, widget.settings)
                                });
                            },
                            onReady: function onReady(ref) {
                                return (_this3.settingsDialog = ref);
                            }
                        }),
                        _react2.default.createElement(
                            _WidgetFunctions2.default,
                            (0, _extends3.default)({ widget: widget }, functions)
                        ),
                        _react2.default.cloneElement(
                            editorWidget.widget.renderWidget({
                                EditorWidget: _EditorWidget2.default,
                                widget: widget
                            }),
                            {
                                widget: widget,
                                onChange: function onChange(model) {
                                    return _onChange({
                                        data: model,
                                        __dirty:
                                            isDirty || !(0, _isEqual3.default)(model, widget.data)
                                    });
                                },
                                isGlobal: isGlobal
                            }
                        ),
                        isGlobal &&
                            isDirty &&
                            _react2.default.createElement(
                                "div",
                                { style: { marginTop: 5 } },
                                "Note: changes on global widgets must be saved explicitly.",
                                _react2.default.createElement("br", null),
                                _react2.default.createElement(
                                    Link,
                                    { onClick: this.applyGlobalWidgetChanges },
                                    _react2.default.createElement(Icon, { icon: "save" }),
                                    " Save changes"
                                )
                            )
                    )
                );
            }
        }
    ]);
    return Widget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Widget, {
    modules: ["Link", "Icon"],
    services: ["cms"]
});
//# sourceMappingURL=Widget.js.map
