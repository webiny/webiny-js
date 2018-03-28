"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Body = require("./Body");

var _Body2 = _interopRequireDefault(_Body);

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var View = (function(_React$Component) {
    (0, _inherits3.default)(View, _React$Component);

    function View(props) {
        (0, _classCallCheck3.default)(this, View);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (View.__proto__ || Object.getPrototypeOf(View)).call(this, props)
        );

        _this.parseLayout = _this.parseLayout.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(View, [
        {
            key: "parseLayout",
            value: function parseLayout(children) {
                var _this2 = this;

                this.headerComponent = null;
                this.bodyComponent = null;
                this.footerComponent = null;

                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }

                _react2.default.Children.map(children, function(child) {
                    if ((0, _webinyApp.isElementOfType)(child, _Header2.default)) {
                        _this2.headerComponent = child;
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Body2.default)) {
                        _this2.bodyComponent = child;
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Footer2.default)) {
                        _this2.footerComponent = child;
                    }
                });
            }
        },
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.parseLayout(this.props.children);
            }
        },
        {
            key: "componentWillUpdate",
            value: function componentWillUpdate(nextProps) {
                this.parseLayout(nextProps.children);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }
                var _props = this.props,
                    Panel = _props.Panel,
                    styles = _props.styles;

                return _react2.default.createElement(
                    "div",
                    null,
                    this.headerComponent,
                    _react2.default.createElement(
                        "div",
                        { className: styles.viewContent },
                        _react2.default.createElement(
                            Panel,
                            { className: styles.panel },
                            this.bodyComponent,
                            this.footerComponent
                        )
                    )
                );
            }
        }
    ]);
    return View;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(View, {
    modules: ["Panel"],
    styles: _styles2.default
});
//# sourceMappingURL=View.js.map
