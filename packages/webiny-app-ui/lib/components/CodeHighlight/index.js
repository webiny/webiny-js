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

require("./styles.scss?extract");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CodeHighlight = (function(_React$Component) {
    (0, _inherits3.default)(CodeHighlight, _React$Component);

    function CodeHighlight() {
        (0, _classCallCheck3.default)(this, CodeHighlight);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CodeHighlight.__proto__ || Object.getPrototypeOf(CodeHighlight)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(CodeHighlight, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.doHighlight();
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this.doHighlight();
            }
        },
        {
            key: "doHighlight",
            value: function doHighlight() {
                this.props.hljs.highlightBlock(this.dom);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "pre",
                    null,
                    _react2.default.createElement(
                        "code",
                        {
                            ref: function ref(_ref) {
                                return (_this2.dom = _ref);
                            },
                            className: this.props.language
                        },
                        this.props.children
                    )
                );
            }
        }
    ]);
    return CodeHighlight;
})(_react2.default.Component);

CodeHighlight.defaultProps = {
    language: "html"
};

exports.default = (0, _webinyApp.createComponent)(CodeHighlight, {
    modules: [{ hljs: "Webiny/Vendors/Highlight" }]
});
//# sourceMappingURL=index.js.map
