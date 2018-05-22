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

var ParagraphWidget = (function(_React$Component) {
    (0, _inherits3.default)(ParagraphWidget, _React$Component);

    function ParagraphWidget() {
        (0, _classCallCheck3.default)(this, ParagraphWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ParagraphWidget.__proto__ || Object.getPrototypeOf(ParagraphWidget)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ParagraphWidget, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Textarea = _props.modules.Textarea,
                    Bind = _props.Bind;

                return _react2.default.createElement(
                    _react2.default.Fragment,
                    null,
                    _react2.default.createElement(
                        Bind,
                        null,
                        _react2.default.createElement(Textarea, { name: "text" })
                    )
                );
            }
        }
    ]);
    return ParagraphWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ParagraphWidget, { modules: ["Textarea"] });
//# sourceMappingURL=Widget.js.map
