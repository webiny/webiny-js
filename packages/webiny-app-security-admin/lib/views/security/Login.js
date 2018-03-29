"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Sign in to your Account"],
        ["Sign in to your Account"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Enter your verification code"],
        ["Enter your verification code"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Verification code"],
        ["Verification code"]
    ),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(["Enter email"], ["Enter email"]),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["Email address"], ["Email address"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(["Password"], ["Password"]),
    _templateObject7 = (0, _taggedTemplateLiteral3.default)(["Submit"], ["Submit"]),
    _templateObject8 = (0, _taggedTemplateLiteral3.default)(["powered by"], ["powered by"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyApp = require("webiny-app");

var _logo_orange = require("webiny-app-admin/lib/assets/images/logo_orange.png");

var _logo_orange2 = _interopRequireDefault(_logo_orange);

var _Login = require("./styles/Login.css");

var _Login2 = _interopRequireDefault(_Login);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.Auth.Login");

var Login = (function(_React$Component) {
    (0, _inherits3.default)(Login, _React$Component);

    function Login(props) {
        (0, _classCallCheck3.default)(this, Login);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Login.__proto__ || Object.getPrototypeOf(Login)).call(this, props)
        );

        (0, _invariant2.default)(props.identity, 'You must specify an "identity" prop!');
        (0, _invariant2.default)(props.strategy, 'You must specify a "strategy" prop!');

        _this.state = {
            twoFactorAuth: false,
            verificationToken: null
        };

        return _this;
    }

    (0, _createClass3.default)(Login, [
        {
            key: "onSubmit",
            value: (function() {
                var _ref2 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(_ref) {
                        var model = _ref.model,
                            form = _ref.form;

                        var auth, _props, identity, strategy, result;

                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            form.setState({ error: null });
                                            form.showLoading();

                                            auth = _webinyApp.app.services.get("authentication");
                                            _context.prev = 3;
                                            (_props = this.props),
                                                (identity = _props.identity),
                                                (strategy = _props.strategy);
                                            _context.next = 7;
                                            return auth.login(identity, strategy, model);

                                        case 7:
                                            result = _context.sent;

                                            if (!result.token) {
                                                _context.next = 10;
                                                break;
                                            }

                                            return _context.abrupt(
                                                "return",
                                                this.props.onSuccess(result)
                                            );

                                        case 10:
                                            _context.next = 15;
                                            break;

                                        case 12:
                                            _context.prev = 12;
                                            _context.t0 = _context["catch"](3);
                                            return _context.abrupt(
                                                "return",
                                                form.handleApiError(_context.t0.data.response)
                                            );

                                        case 15:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this,
                            [[3, 12]]
                        );
                    })
                );

                function onSubmit(_x) {
                    return _ref2.apply(this, arguments);
                }

                return onSubmit;
            })()
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props2 = this.props,
                    Form = _props2.Form,
                    Input = _props2.Input,
                    Password = _props2.Password,
                    Button = _props2.Button,
                    Email = _props2.Email;

                return _react2.default.createElement(
                    "sign-in-form",
                    {
                        class: (0, _classnames2.default)("sign-in", this.props.overlay && "overlay")
                    },
                    _react2.default.createElement(
                        Form,
                        {
                            onSubmit: function onSubmit(params) {
                                return _this2.onSubmit(params);
                            }
                        },
                        function(_ref3) {
                            var form = _ref3.form;
                            return _react2.default.createElement(
                                "div",
                                { className: "container" },
                                _react2.default.createElement(
                                    "div",
                                    { className: "sign-in-holder" },
                                    _react2.default.createElement(
                                        "div",
                                        { className: "form-signin" },
                                        _react2.default.createElement(Form.Loader, null),
                                        _react2.default.createElement(
                                            "a",
                                            { href: "#", className: "logo" },
                                            _react2.default.createElement("img", {
                                                src: _logo_orange2.default,
                                                width: "180",
                                                height: "58"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "h2",
                                            { className: "form-signin-heading" },
                                            _react2.default.createElement("span", null),
                                            t(_templateObject)
                                        ),
                                        _react2.default.createElement("div", {
                                            className: "clear"
                                        }),
                                        _react2.default.createElement(Form.Error, null),
                                        _react2.default.createElement("div", {
                                            className: "clear"
                                        }),
                                        _this2.state.twoFactorAuth &&
                                            _react2.default.createElement(Input, {
                                                name: "twoFactorAuthCode",
                                                placeholder: t(_templateObject2),
                                                label: t(_templateObject3),
                                                validators: "required",
                                                onEnter: form.submit,
                                                autoFocus: true
                                            }),
                                        !_this2.state.twoFactorAuth &&
                                            _react2.default.createElement(
                                                "div",
                                                null,
                                                _react2.default.createElement(Email, {
                                                    name: "username",
                                                    placeholder: t(_templateObject4),
                                                    label: t(_templateObject5),
                                                    validators: "required",
                                                    onEnter: form.submit,
                                                    autoFocus: true
                                                }),
                                                _react2.default.createElement(Password, {
                                                    name: "password",
                                                    placeholder: t(_templateObject6),
                                                    label: t(_templateObject6),
                                                    validators: "required",
                                                    onEnter: form.submit
                                                })
                                            ),
                                        _react2.default.createElement(
                                            "div",
                                            { className: "form-footer" },
                                            _react2.default.createElement(
                                                Button,
                                                {
                                                    type: "primary",
                                                    style: { float: "right" },
                                                    size: "large",
                                                    onClick: form.submit,
                                                    icon: "icon-next",
                                                    className: _Login2.default.btnLogin
                                                },
                                                _react2.default.createElement(
                                                    "span",
                                                    null,
                                                    t(_templateObject7)
                                                )
                                            )
                                        )
                                    ),
                                    _react2.default.createElement(
                                        "p",
                                        { className: "copyright" },
                                        t(_templateObject8)
                                    ),
                                    _react2.default.createElement(
                                        "a",
                                        { href: "https://www.webiny.com/", className: "site" },
                                        "www.webiny.com"
                                    )
                                )
                            );
                        }
                    )
                );
            }
        }
    ]);
    return Login;
})(_react2.default.Component);

Login.defaultProps = {
    overlay: false
};

exports.default = (0, _webinyApp.createComponent)(Login, {
    modules: ["Form", "Input", "Password", "Button", "Email"]
});
//# sourceMappingURL=Login.js.map
