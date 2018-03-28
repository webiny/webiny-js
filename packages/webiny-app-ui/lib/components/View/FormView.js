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

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

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

var FormView = (function(_React$Component) {
    (0, _inherits3.default)(FormView, _React$Component);

    function FormView(props) {
        (0, _classCallCheck3.default)(this, FormView);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (FormView.__proto__ || Object.getPrototypeOf(FormView)).call(this, props)
        );

        _this.parseLayout = _this.parseLayout.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(FormView, [
        {
            key: "parseLayout",
            value: function parseLayout(children) {
                var _this2 = this;

                if (!this.props.form) {
                    console.error("<View.Form> must be a child of a Form element!");
                    return;
                }

                this.headerComponent = null;
                this.bodyComponent = null;
                this.footerComponent = null;
                this.errorComponent = null;

                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }

                var Form = this.props.Form;
                // Loop through View elements and detect header/body/footer components

                _react2.default.Children.map(children, function(child) {
                    if ((0, _webinyApp.isElementOfType)(child, _Header2.default)) {
                        _this2.headerComponent = child;
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Body2.default)) {
                        // Check if form loader exists in body
                        var loader = null;
                        _react2.default.Children.map(child.props.children, function(bodyChild) {
                            if ((0, _webinyApp.isElementOfType)(bodyChild, Form.Loader)) {
                                loader = true;
                            }
                        });

                        if (loader) {
                            // We have our body element
                            _this2.bodyComponent = child;
                        } else {
                            // We need to create form loader ourselves
                            var bodyChildren = _react2.default.Children.toArray(
                                child.props.children
                            );
                            bodyChildren.push(
                                _react2.default.createElement(Form.Loader, {
                                    key: "loader",
                                    show: _this2.props.form.isLoading()
                                })
                            );
                            _this2.bodyComponent = _react2.default.cloneElement(
                                child,
                                child.props,
                                bodyChildren
                            );
                        }
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Footer2.default)) {
                        _this2.footerComponent = child;
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, Form.Error)) {
                        _this2.errorComponent = _react2.default.cloneElement(
                            child,
                            (0, _merge3.default)(child.props, {
                                error: _this2.props.form.getError()
                            })
                        );
                    }
                });

                if (!this.errorComponent) {
                    this.errorComponent = _react2.default.createElement(Form.Error, {
                        error: this.props.form.getError()
                    });
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
                        this.errorComponent,
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
    return FormView;
})(_react2.default.Component);

FormView.defaultProps = {
    formInject: true
};

exports.default = (0, _webinyApp.createComponent)(FormView, {
    modules: ["Panel", "Form"],
    styles: _styles2.default
});
//# sourceMappingURL=FormView.js.map
