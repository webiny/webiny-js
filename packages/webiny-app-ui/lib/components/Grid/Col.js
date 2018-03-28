"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var propsMap = {
    xs: "xs",
    xsOffset: "xs-offset",
    xsPull: "xs-pull",
    xsPush: "xs-push",
    sm: "sm",
    smOffset: "sm-offset",
    smPull: "sm-pull",
    smPush: "sm-push",
    md: "md",
    mdOffset: "md-offset",
    mdPull: "md-pull",
    mdPush: "md-push",
    lg: "lg",
    lgOffset: "lg-offset",
    lgPull: "lg-pull",
    lgPush: "lg-push"
};

function getCssClass(key, val) {
    if (key === "all") {
        return "" + getCssClass("md", val);
    }
    return propsMap[key] ? "col-" + propsMap[key] + "-" + val : false;
}

var Col = (function(_React$Component) {
    (0, _inherits3.default)(Col, _React$Component);

    function Col() {
        (0, _classCallCheck3.default)(this, Col);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Col.__proto__ || Object.getPrototypeOf(Col)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Col, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = Object.assign({}, this.props);
                var cssClasses = [];

                var cls = typeof props.className === "string" ? props.className.trim() : "";
                if (cls !== "") {
                    cssClasses = cls.split(" ");
                }
                delete props["className"];

                Object.keys(props).forEach(function(key) {
                    var newClass = getCssClass(key, props[key]);
                    if (newClass) {
                        cssClasses.push(newClass);
                    }
                });

                ["children", "render", "className", "all"]
                    .concat(Object.keys(propsMap))
                    .forEach(function(key) {
                        return delete props[key];
                    });

                return _react2.default.createElement(
                    "div",
                    (0, _extends3.default)(
                        { className: (0, _classnames2.default)(cssClasses) },
                        props
                    ),
                    this.props.children
                );
            }
        }
    ]);
    return Col;
})(_react2.default.Component);

Col.defaultProps = {
    className: null,
    style: null
};

exports.default = Col;
//# sourceMappingURL=Col.js.map
