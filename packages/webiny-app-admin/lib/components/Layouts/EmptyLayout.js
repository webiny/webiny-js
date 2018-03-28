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

var EmptyLayout = (function(_React$Component) {
    (0, _inherits3.default)(EmptyLayout, _React$Component);

    function EmptyLayout() {
        (0, _classCallCheck3.default)(this, EmptyLayout);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (EmptyLayout.__proto__ || Object.getPrototypeOf(EmptyLayout)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(EmptyLayout, [
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    "div",
                    { className: "master minimized" },
                    _react2.default.createElement(
                        "div",
                        { className: "master-content" },
                        _react2.default.createElement(
                            "div",
                            { className: "container-fluid" },
                            this.props.children
                        )
                    )
                );
            }
        }
    ]);
    return EmptyLayout;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(EmptyLayout);
//# sourceMappingURL=EmptyLayout.js.map
