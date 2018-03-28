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

var _HeaderLeft = require("./DashboardComponents/HeaderLeft");

var _HeaderLeft2 = _interopRequireDefault(_HeaderLeft);

var _HeaderCenter = require("./DashboardComponents/HeaderCenter");

var _HeaderCenter2 = _interopRequireDefault(_HeaderCenter);

var _HeaderRight = require("./DashboardComponents/HeaderRight");

var _HeaderRight2 = _interopRequireDefault(_HeaderRight);

var _Body = require("./Body");

var _Body2 = _interopRequireDefault(_Body);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var DashboardView = (function(_React$Component) {
    (0, _inherits3.default)(DashboardView, _React$Component);

    function DashboardView(props) {
        (0, _classCallCheck3.default)(this, DashboardView);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DashboardView.__proto__ || Object.getPrototypeOf(DashboardView)).call(this, props)
        );

        _this.parseLayout = _this.parseLayout.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(DashboardView, [
        {
            key: "parseLayout",
            value: function parseLayout(children) {
                var _this2 = this;

                this.headerLeft = null;
                this.headerCenter = null;
                this.headerRight = [];
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
                        _this2.headerLeft = _react2.default.createElement(_HeaderLeft2.default, {
                            title: child.props.title,
                            description: child.props.description
                        });

                        _react2.default.Children.map(child.props.children, function(subChild) {
                            if ((0, _webinyApp.isElementOfType)(subChild, _HeaderCenter2.default)) {
                                _this2.headerCenter = _react2.default.createElement(
                                    _HeaderCenter2.default,
                                    subChild.props
                                );
                            } else {
                                _this2.headerRight.push(subChild);
                            }
                        });

                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Body2.default)) {
                        _this2.bodyComponent = child.props.children;
                    }
                });

                if (this.headerRight.length > 0) {
                    this.headerRight = _react2.default.createElement(_HeaderRight2.default, {
                        children: this.headerRight
                    });
                } else {
                    this.headerRight = null;
                }
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

                var styles = this.props.styles;

                return _react2.default.createElement(
                    "div",
                    { className: styles.dashboard },
                    _react2.default.createElement(
                        "div",
                        { className: styles.viewHeader },
                        this.headerLeft,
                        this.headerCenter,
                        this.headerRight
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: styles.content },
                        this.bodyComponent
                    )
                );
            }
        }
    ]);
    return DashboardView;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(DashboardView, { styles: _styles2.default });
//# sourceMappingURL=DashboardView.js.map
