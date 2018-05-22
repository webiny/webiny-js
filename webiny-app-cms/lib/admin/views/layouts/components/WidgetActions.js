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

var WidgetActions = (function(_React$Component) {
    (0, _inherits3.default)(WidgetActions, _React$Component);

    function WidgetActions() {
        (0, _classCallCheck3.default)(this, WidgetActions);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetActions.__proto__ || Object.getPrototypeOf(WidgetActions)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(WidgetActions, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    children = _props.children,
                    Icon = _props.modules.Icon;

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
                            _react2.default.Children.map(children, function(child, i) {
                                return _react2.default.createElement("li", { key: i }, child);
                            })
                        )
                    )
                );
            }
        }
    ]);
    return WidgetActions;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(WidgetActions, { modules: ["Icon"] });
//# sourceMappingURL=WidgetActions.js.map
