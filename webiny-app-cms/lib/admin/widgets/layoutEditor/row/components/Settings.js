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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowWidgetSettings = (function(_React$Component) {
    (0, _inherits3.default)(RowWidgetSettings, _React$Component);

    function RowWidgetSettings() {
        (0, _classCallCheck3.default)(this, RowWidgetSettings);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (RowWidgetSettings.__proto__ || Object.getPrototypeOf(RowWidgetSettings)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(RowWidgetSettings, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Select = _props.modules.Select,
                    Bind = _props.Bind;

                return _react2.default.createElement(_react.Fragment, null, "Coming soon...");
            }
        }
    ]);
    return RowWidgetSettings;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(RowWidgetSettings, {
    modules: ["Select"]
});
//# sourceMappingURL=Settings.js.map
