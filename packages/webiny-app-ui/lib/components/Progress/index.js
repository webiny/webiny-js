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

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Progress = (function(_React$Component) {
    (0, _inherits3.default)(Progress, _React$Component);

    function Progress() {
        (0, _classCallCheck3.default)(this, Progress);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Progress.__proto__ || Object.getPrototypeOf(Progress)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Progress, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    value = _props.value;

                return _react2.default.createElement(
                    "div",
                    { className: styles.wrapper },
                    _react2.default.createElement(
                        "div",
                        { className: styles.bar },
                        _react2.default.createElement("div", {
                            className: styles.barInner,
                            role: "progressbar",
                            "aria-valuenow": value,
                            "aria-valuemin": "0",
                            "aria-valuemax": "100",
                            style: { width: value + "%" }
                        })
                    )
                );
            }
        }
    ]);
    return Progress;
})(_react2.default.Component);

Progress.defaultProps = {
    value: 0
};

exports.default = (0, _webinyApp.createComponent)(Progress, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
