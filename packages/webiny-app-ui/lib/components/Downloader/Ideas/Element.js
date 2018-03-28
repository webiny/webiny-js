"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

var Element = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(Element, _Webiny$Ui$Component);

    function Element() {
        (0, _classCallCheck3.default)(this, Element);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Element.__proto__ || Object.getPrototypeOf(Element)).apply(this, arguments)
        );
    }

    return Element;
})(_webinyApp.Webiny.Ui.Component);

Element.defaultProps = {
    renderer: function renderer() {
        return _react2.default.createElement(
            "webiny-download-element",
            null,
            this.props.children({ download: this.props.download })
        );
    }
};

exports.default = Element;
//# sourceMappingURL=Element.js.map
