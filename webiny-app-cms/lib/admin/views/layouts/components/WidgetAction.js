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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WidgetAction = (function(_React$Component) {
    (0, _inherits3.default)(WidgetAction, _React$Component);

    function WidgetAction() {
        (0, _classCallCheck3.default)(this, WidgetAction);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetAction.__proto__ || Object.getPrototypeOf(WidgetAction)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(WidgetAction, [
        {
            key: "renderTooltip",
            value: function renderTooltip(onClick) {
                var _props = this.props,
                    icon = _props.icon,
                    tooltip = _props.tooltip,
                    _props$modules = _props.modules,
                    Tooltip = _props$modules.Tooltip,
                    Icon = _props$modules.Icon;

                return _react2.default.createElement(
                    Tooltip,
                    {
                        target: _react2.default.createElement(
                            "a",
                            { href: "javascript:void(0)", onClick: onClick },
                            _react2.default.createElement(Icon, { icon: icon })
                        )
                    },
                    tooltip
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props2 = this.props,
                    confirm = _props2.confirm,
                    _props2$onClick = _props2.onClick,
                    onClick = _props2$onClick === undefined ? _noop3.default : _props2$onClick,
                    _props2$onComplete = _props2.onComplete,
                    onComplete =
                        _props2$onComplete === undefined ? _noop3.default : _props2$onComplete,
                    ClickConfirm = _props2.modules.ClickConfirm;

                if (!confirm) {
                    return this.renderTooltip(onClick);
                }

                return _react2.default.createElement(
                    ClickConfirm,
                    { message: confirm, onComplete: onComplete },
                    function(_ref) {
                        var showConfirmation = _ref.showConfirmation;
                        return _this2.renderTooltip(function() {
                            return showConfirmation(onClick);
                        });
                    }
                );
            }
        }
    ]);
    return WidgetAction;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(WidgetAction, {
    modules: ["Tooltip", "ClickConfirm", "Icon"]
});
//# sourceMappingURL=WidgetAction.js.map
