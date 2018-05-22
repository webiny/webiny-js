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

var _webinyApp = require("webiny-app");

var _LayoutWidgetFunctions = require("./styles/LayoutWidgetFunctions.scss?");

var _LayoutWidgetFunctions2 = _interopRequireDefault(_LayoutWidgetFunctions);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WidgetFunctions = (function(_React$Component) {
    (0, _inherits3.default)(WidgetFunctions, _React$Component);

    function WidgetFunctions() {
        (0, _classCallCheck3.default)(this, WidgetFunctions);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetFunctions.__proto__ || Object.getPrototypeOf(WidgetFunctions)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(WidgetFunctions, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    _props$modules = _props.modules,
                    Icon = _props$modules.Icon,
                    ClickConfirm = _props$modules.ClickConfirm,
                    Tooltip = _props$modules.Tooltip,
                    moveUp = _props.moveUp,
                    moveDown = _props.moveDown,
                    onRemoved = _props.onRemoved,
                    showSettings = _props.showSettings;

                return _react2.default.createElement(
                    "div",
                    { className: _LayoutWidgetFunctions2.default.widgetFunctions },
                    _react2.default.createElement(
                        "a",
                        { href: "javascript:void(0)", className: "editor-row-functions" },
                        _react2.default.createElement(Icon, { icon: ["fas", "pencil-alt"] })
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: _LayoutWidgetFunctions2.default.functions },
                        _react2.default.createElement(
                            "ul",
                            null,
                            _react2.default.createElement(
                                "li",
                                null,
                                _react2.default.createElement(
                                    Tooltip,
                                    {
                                        target: _react2.default.createElement(
                                            "a",
                                            { href: "javascript:void(0)", onClick: moveUp },
                                            _react2.default.createElement(Icon, {
                                                icon: ["fas", "sort-up"]
                                            })
                                        )
                                    },
                                    "Move widget up"
                                )
                            ),
                            _react2.default.createElement(
                                "li",
                                null,
                                _react2.default.createElement(
                                    Tooltip,
                                    {
                                        target: _react2.default.createElement(
                                            "a",
                                            { href: "javascript:void(0)", onClick: showSettings },
                                            _react2.default.createElement(Icon, {
                                                icon: ["fas", "cog"]
                                            })
                                        )
                                    },
                                    "Open widget settings"
                                )
                            ),
                            _react2.default.createElement(
                                "li",
                                null,
                                _react2.default.createElement(
                                    ClickConfirm,
                                    {
                                        message:
                                            "Are you sure you want to delete this widget and all of its contents?",
                                        onComplete: onRemoved
                                    },
                                    function(_ref) {
                                        var showConfirmation = _ref.showConfirmation;
                                        return _react2.default.createElement(
                                            Tooltip,
                                            {
                                                target: _react2.default.createElement(
                                                    "a",
                                                    {
                                                        href: "javascript:void(0)",
                                                        onClick: function onClick() {
                                                            return showConfirmation();
                                                        }
                                                    },
                                                    _react2.default.createElement(Icon, {
                                                        icon: ["fas", "times"]
                                                    })
                                                )
                                            },
                                            "Delete widget"
                                        );
                                    }
                                )
                            ),
                            _react2.default.createElement(
                                "li",
                                null,
                                _react2.default.createElement(
                                    Tooltip,
                                    {
                                        target: _react2.default.createElement(
                                            "a",
                                            { href: "javascript:void(0)", onClick: moveDown },
                                            _react2.default.createElement(Icon, {
                                                icon: ["fas", "sort-down"]
                                            })
                                        )
                                    },
                                    "Move widget down"
                                )
                            )
                        )
                    )
                );
            }
        }
    ]);
    return WidgetFunctions;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(WidgetFunctions, {
    modules: ["Icon", "ClickConfirm", "Tooltip"]
});
//# sourceMappingURL=WidgetFunctions.js.map
