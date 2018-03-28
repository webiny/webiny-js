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

var _logo = require("./../assets/images/logo.png");

var _logo2 = _interopRequireDefault(_logo);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Logo = (function(_React$Component) {
    (0, _inherits3.default)(Logo, _React$Component);

    function Logo(props) {
        (0, _classCallCheck3.default)(this, Logo);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Logo.__proto__ || Object.getPrototypeOf(Logo)).call(this, props)
        );

        _this.state = {
            display: "desktop"
        };
        return _this;
    }

    (0, _createClass3.default)(Logo, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                this.checkDisplayInterval = setInterval(function() {
                    _this2.setState({ display: window.outerWidth > 768 ? "desktop" : "mobile" });
                }, 500);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                clearInterval(this.checkDisplayInterval);
            }
        },
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    className = _props.className,
                    href = _props.href,
                    img = _props.img,
                    altText = _props.altText;

                var style = {
                    width: this.props.width,
                    height: this.props.height
                };

                if (this.state.display !== "desktop") {
                    style.width = this.props.mobileWidth;
                    style.height = this.props.mobileHeight;
                }

                return _react2.default.createElement(
                    "a",
                    { href: href, className: className },
                    _react2.default.createElement("img", { src: img, style: style, alt: altText })
                );
            }
        }
    ]);
    return Logo;
})(_react2.default.Component);

Logo.defaultProps = {
    className: "logo",
    img: _logo2.default,
    width: 100,
    height: 32,
    mobileWidth: 62,
    mobileHeight: 20,
    altText: "Webiny",
    href: "#"
};

exports.default = (0, _webinyApp.createComponent)(Logo);
//# sourceMappingURL=Logo.js.map
