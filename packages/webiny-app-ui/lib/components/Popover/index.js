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

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

require("./styles.scss");

var _server = require("react-dom/server");

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Popover = (function(_React$Component) {
    (0, _inherits3.default)(Popover, _React$Component);

    function Popover() {
        (0, _classCallCheck3.default)(this, Popover);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Popover.__proto__ || Object.getPrototypeOf(Popover)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Popover, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.initPopover.call(this);
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this.initPopover.call(this);
            }
        },
        {
            key: "initPopover",
            value: function initPopover() {
                (0, _jquery2.default)(this.dom).popover({
                    html: true,
                    trigger: this.props.trigger,
                    placement: this.props.placement
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var html = this.props.children;
                if (!(0, _isString3.default)(html)) {
                    html = _server2.default.renderToStaticMarkup(this.props.children);
                }
                return _react2.default.createElement(
                    "span",
                    {
                        ref: function ref(_ref) {
                            return (_this2.dom = _ref);
                        },
                        title: this.props.title,
                        "data-content": html
                    },
                    this.props.target
                );
            }
        }
    ]);
    return Popover;
})(_react2.default.Component);

Popover.defaultProps = {
    title: null,
    trigger: "hover",
    placement: "right"
};

exports.default = (0, _webinyApp.createComponent)(Popover);
//# sourceMappingURL=index.js.map
