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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RouteAction = (function(_React$Component) {
    (0, _inherits3.default)(RouteAction, _React$Component);

    function RouteAction(props) {
        (0, _classCallCheck3.default)(this, RouteAction);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (RouteAction.__proto__ || Object.getPrototypeOf(RouteAction)).call(this, props)
        );

        ["getRoute", "getParams"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(RouteAction, [
        {
            key: "getRoute",
            value: function getRoute() {
                return (0, _isFunction3.default)(this.props.route)
                    ? this.props.route(this.props.data)
                    : this.props.route;
            }
        },
        {
            key: "getParams",
            value: function getParams() {
                var _this2 = this;

                var params = {};

                if (!this.props.params) {
                    var routeParams = _webinyApp.app.router.getRoute(this.getRoute()).params;
                    routeParams.map(function(p) {
                        params[p.name] = _this2.props.data[p.name];
                    });
                } else {
                    params = Object.assign({}, this.props.params);
                }

                if ((0, _isFunction3.default)(params)) {
                    //noinspection JSUnresolvedFunction
                    params = params(this.props.data);
                }

                return params;
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (
                    (0, _isFunction3.default)(this.props.hide) &&
                    this.props.hide(this.props.data)
                ) {
                    return null;
                }

                var _props = this.props,
                    Link = _props.Link,
                    Icon = _props.Icon;

                return _react2.default.createElement(
                    Link,
                    { route: this.getRoute(), params: this.getParams() },
                    this.props.icon
                        ? _react2.default.createElement(Icon, { icon: this.props.icon })
                        : null,
                    this.props.label || this.props.children
                );
            }
        }
    ]);
    return RouteAction;
})(_react2.default.Component);

RouteAction.defaultProps = {
    params: null,
    route: null,
    data: {},
    label: null,
    hide: null
};

exports.default = (0, _webinyApp.createComponent)(RouteAction, { modules: ["Link", "Icon"] });
//# sourceMappingURL=RouteAction.js.map
