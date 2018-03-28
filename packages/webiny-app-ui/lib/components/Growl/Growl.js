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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Growl = (function(_React$Component) {
    (0, _inherits3.default)(Growl, _React$Component);

    function Growl(props) {
        (0, _classCallCheck3.default)(this, Growl);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Growl.__proto__ || Object.getPrototypeOf(Growl)).call(this, props)
        );

        _this.close = _this.close.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Growl, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (!this.props.sticky) {
                    this.closeDelay = setTimeout(function() {
                        _this2.close();
                    }, this.props.ttl || 3000);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                clearTimeout(this.closeDelay);
                this.closeDelay = null;
            }
        },
        {
            key: "close",
            value: function close() {
                this.props.onRemove(this);
            }
        },
        {
            key: "render",
            value: function render() {
                var styles = this.props.styles;

                var typeClasses = {
                    default: "",
                    danger: styles.danger,
                    success: styles.success,
                    warning: styles.warning
                };

                var classes = (0, _classnames2.default)(
                    styles.notification,
                    typeClasses[this.props.type],
                    this.props.className
                );
                var title = this.props.title
                    ? _react2.default.createElement(
                          "div",
                          { className: styles.header },
                          this.props.title
                      )
                    : null;
                var messages = [];
                if (this.props.message) {
                    messages.push(this.props.message);
                }

                if (this.props.children) {
                    messages = _react2.default.Children.toArray(this.props.children);
                }

                return _react2.default.createElement(
                    "div",
                    { className: classes, style: { display: "block" }, ref: this.props.onRef },
                    _react2.default.createElement(
                        "div",
                        { className: styles.close, onClick: this.close },
                        "\xD7"
                    ),
                    title,
                    messages.map(function(msg, i) {
                        return _react2.default.createElement(
                            "div",
                            { key: i, className: styles.message },
                            msg
                        );
                    })
                );
            }
        }
    ]);
    return Growl;
})(_react2.default.Component);

Growl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    className: null,
    type: "default",
    onRef: null
};

exports.default = (0, _webinyApp.createComponent)(Growl, { styles: _styles2.default });
//# sourceMappingURL=Growl.js.map
