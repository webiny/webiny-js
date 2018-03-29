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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

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

var Link = (function(_React$Component) {
    (0, _inherits3.default)(Link, _React$Component);

    function Link(props) {
        (0, _classCallCheck3.default)(this, Link);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Link.__proto__ || Object.getPrototypeOf(Link)).call(this, props)
        );

        _this.getLinkProps = _this.getLinkProps.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Link, [
        {
            key: "getLinkProps",
            value: function getLinkProps() {
                var _this2 = this;

                var props = (0, _clone3.default)(this.props);
                var styles = this.props.styles;

                props.href = "javascript:void(0)";

                if (!props.disabled) {
                    if (props.mailTo) {
                        props.href = "mailto:" + props.mailTo;
                    } else if (props.url) {
                        // Let's ensure we have at least http:// specified - for cases where users just type www...
                        if (!/^(f|ht)tps?:\/\//i.test(props.url) && !props.url.startsWith("/")) {
                            props.url = "http://" + props.url;
                        }
                        props.href = props.url;
                    } else if (props.route) {
                        var route = props.route;
                        if ((0, _isString3.default)(route)) {
                            route =
                                route === "current"
                                    ? _webinyApp.app.router.route
                                    : _webinyApp.app.router.getRoute(route);
                        }

                        if (!route) {
                            props.href = "javascript:void(0)";
                        } else {
                            props.href = _webinyApp.app.router.createHref(route.name, props.params);
                            if (props.href.startsWith("//")) {
                                props.href = props.href.substring(1); // Get everything after first character (after first slash)
                            }
                        }
                    }
                }

                if (props.separate || props.newTab) {
                    props.target = "_blank";
                }

                var typeClasses = {
                    default: styles.btnDefault,
                    primary: styles.btnPrimary,
                    secondary: styles.btnSuccess
                };

                var alignClasses = {
                    normal: "",
                    left: "pull-left",
                    right: "pull-right"
                };

                var sizeClasses = {
                    normal: "",
                    large: styles.btnLarge
                    //small: 'btn-sm' // sven: this option doesn't exist in css
                };

                var classes = {};

                if (this.props.type) {
                    classes[typeClasses[this.props.type]] = true;
                }

                if (this.props.size) {
                    classes[sizeClasses[this.props.size]] = true;
                }

                if (this.props.align) {
                    classes[alignClasses[props.align]] = true;
                }

                if (this.props.className) {
                    classes[this.props.className] = true;
                }

                if (this.props.disabled) {
                    classes[styles.disabled] = true;
                }

                props.className = (0, _classnames2.default)(classes);

                if (props.preventScroll) {
                    props["data-prevent-scroll"] = true;
                }

                if (props.documentTitle) {
                    props["data-document-title"] = props.documentTitle;
                }

                var finalProps = [];
                (0, _each3.default)(props, function(value, prop) {
                    if (_this2.allowedProps.includes(prop) || prop.startsWith("data-")) {
                        finalProps[prop] = value;
                    }
                });

                if (props.onClick) {
                    props.onClick = function(e) {
                        return _this2.props.onClick({ event: e });
                    };
                }
                return finalProps;
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement("a", this.getLinkProps(), this.props.children);
            }
        }
    ]);
    return Link;
})(_react2.default.Component);

// We can define this on prototype since it is not going to change between instances and we want to it accessible via "this"

Link.prototype.allowedProps = [
    "className",
    "style",
    "target",
    "href",
    "onClick",
    "title",
    "tabIndex"
];

Link.defaultProps = {
    align: null,
    type: null,
    size: null,
    url: null,
    mailTo: null,
    title: null,
    route: null,
    preventScroll: false,
    params: {},
    separate: false,
    newTab: false,
    className: null,
    tabIndex: null,
    onClick: null
};

exports.default = (0, _webinyApp.createComponent)(Link, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
