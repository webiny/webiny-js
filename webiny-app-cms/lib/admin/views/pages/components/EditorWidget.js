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

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var EditorWidget = (function(_React$Component) {
    (0, _inherits3.default)(EditorWidget, _React$Component);

    function EditorWidget() {
        (0, _classCallCheck3.default)(this, EditorWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (EditorWidget.__proto__ || Object.getPrototypeOf(EditorWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(EditorWidget, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Form = _props.modules.Form,
                    value = _props.value,
                    onChange = _props.onChange;

                return _react2.default.createElement(
                    Form,
                    { model: value.data, onChange: onChange },
                    this.props.children
                );
            }
        }
    ]);
    return EditorWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([EditorWidget, _webinyAppUi.FormComponent], {
    modules: ["Form"]
});
//# sourceMappingURL=EditorWidget.js.map
