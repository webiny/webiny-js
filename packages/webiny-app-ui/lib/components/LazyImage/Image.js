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

var Image = (function(_React$Component) {
    (0, _inherits3.default)(Image, _React$Component);

    function Image() {
        (0, _classCallCheck3.default)(this, Image);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Image.__proto__ || Object.getPrototypeOf(Image)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Image, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement("img", {
                    src:
                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                    "data-src": this.props.src,
                    width: this.props.width,
                    height: this.props.height,
                    alt: this.props.alt,
                    className: this.props.className
                });
            }
        }
    ]);
    return Image;
})(_react2.default.Component);

Image.defaultProps = {
    alt: null,
    className: null,
    src: null,
    width: null,
    height: null
};

exports.default = (0, _webinyApp.createComponent)(Image);
//# sourceMappingURL=Image.js.map
