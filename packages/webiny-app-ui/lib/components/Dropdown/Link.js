"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Link = (function(_React$Component) {
    (0, _inherits3.default)(Link, _React$Component);

    function Link() {
        (0, _classCallCheck3.default)(this, Link);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Link.__proto__ || Object.getPrototypeOf(Link)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Link, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Link = _props.Link,
                    Icon = _props.Icon,
                    props = (0, _objectWithoutProperties3.default)(_props, ["Link", "Icon"]);

                var icon = props.icon
                    ? _react2.default.createElement(Icon, { icon: props.icon })
                    : null;
                var link = _react2.default.createElement(
                    Link,
                    { onClick: this.props.onClick, route: this.props.route },
                    icon,
                    " ",
                    props.title
                );

                if (props.children && !(0, _isString3.default)(props.children)) {
                    link = this.props.children;
                }

                return _react2.default.createElement("li", { role: "presentation" }, link);
            }
        }
    ]);
    return Link;
})(_react2.default.Component);

Link.defaultProps = {
    route: null
};

exports.default = (0, _webinyApp.createComponent)(Link, { modules: ["Link", "Icon"] });
//# sourceMappingURL=Link.js.map
