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

var Gravatar = (function(_React$Component) {
    (0, _inherits3.default)(Gravatar, _React$Component);

    function Gravatar() {
        (0, _classCallCheck3.default)(this, Gravatar);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Gravatar.__proto__ || Object.getPrototypeOf(Gravatar)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Gravatar, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = {
                    src: "//www.gravatar.com/avatar/" + this.props.hash + "?s=" + this.props.size,
                    width: this.props.size,
                    height: this.props.size,
                    className: this.props.className
                };

                return _react2.default.createElement("img", props);
            }
        }
    ]);
    return Gravatar;
})(_react2.default.Component);

Gravatar.defaultProps = {
    hash: null,
    size: 48,
    className: null
};

exports.default = (0, _webinyApp.createComponent)(Gravatar);
//# sourceMappingURL=index.js.map
