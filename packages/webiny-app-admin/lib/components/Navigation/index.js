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

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Navigation = (function(_React$Component) {
    (0, _inherits3.default)(Navigation, _React$Component);

    function Navigation(props) {
        (0, _classCallCheck3.default)(this, Navigation);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Navigation.__proto__ || Object.getPrototypeOf(Navigation)).call(this, props)
        );

        _this.state = {
            user: null,
            highlight: null,
            display: window.outerWidth > 768 ? "desktop" : "mobile"
        };

        _this.auth = _webinyApp.app.services.get("authentication");
        _this.checkDisplayInterval = null;
        return _this;
    }

    (0, _createClass3.default)(Navigation, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.auth) {
                    // Navigation is rendered based on user roles so we need to watch for changes
                    this.unwatch = this.auth.onIdentity(function(identity) {
                        _this2.setState({ user: identity });
                    });

                    this.setState({ user: this.auth.identity });
                }

                this.checkDisplayInterval = setInterval(function() {
                    _this2.setState({ display: window.outerWidth > 768 ? "desktop" : "mobile" });
                }, 500);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                clearInterval(this.checkDisplayInterval);

                // Release data cursors
                this.unwatch && this.unwatch();
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                return !(0, _isEqual3.default)(this.state, nextState);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Desktop = _props.Desktop,
                    Mobile = _props.Mobile;

                var props = {
                    highlight: this.state.highlight
                };

                if (this.state.display === "mobile") {
                    return _react2.default.createElement(Mobile, props);
                }

                return _react2.default.createElement(Desktop, props);
            }
        }
    ]);
    return Navigation;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Navigation, {
    modules: [
        "Link",
        {
            Desktop: "Skeleton.Navigation.Desktop",
            Mobile: "Skeleton.Navigation.Mobile"
        }
    ]
});
//# sourceMappingURL=index.js.map
