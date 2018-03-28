"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Two Factor Auth"],
        ["Two Factor Auth"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Success"], ["Success"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Your two factor authentication is now active."],
        ["Your two factor authentication is now active."]
    ),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(["Recovery codes"], ["Recovery codes"]),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["Important"], ["Important"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(
        [
            "Please write down the recovery codes. In case you can't\n                                                generate a code via the authenticator app for some reason,\n                                                you can use a recovery code to access your account."
        ],
        [
            "Please write down the recovery codes. In case you can't\n                                                generate a code via the authenticator app for some reason,\n                                                you can use a recovery code to access your account."
        ]
    ),
    _templateObject7 = (0, _taggedTemplateLiteral3.default)(
        ["Note that once you use a specific code, it gets deleted."],
        ["Note that once you use a specific code, it gets deleted."]
    ),
    _templateObject8 = (0, _taggedTemplateLiteral3.default)(
        ["I've noted the recovery codes"],
        ["I've noted the recovery codes"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.UserAccount.TwoFactorAuthConfirmation");

// TODO: @i18nRefactor Class extended old "Webiny.Ui.ModalComponent".

var TwoFactorAuthConfirmation = (function(_React$Component) {
    (0, _inherits3.default)(TwoFactorAuthConfirmation, _React$Component);

    function TwoFactorAuthConfirmation() {
        (0, _classCallCheck3.default)(this, TwoFactorAuthConfirmation);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (
                TwoFactorAuthConfirmation.__proto__ ||
                Object.getPrototypeOf(TwoFactorAuthConfirmation)
            ).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TwoFactorAuthConfirmation, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _props = this.props,
                    Modal = _props.Modal,
                    Data = _props.Data,
                    Grid = _props.Grid,
                    Alert = _props.Alert,
                    Button = _props.Button,
                    Section = _props.Section;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, { title: t(_templateObject) }),
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            _react2.default.createElement(
                                Grid.Row,
                                null,
                                _react2.default.createElement(
                                    Grid.Col,
                                    { all: 12 },
                                    _react2.default.createElement(
                                        Alert,
                                        { type: "success", title: t(_templateObject2) },
                                        t(_templateObject3)
                                    )
                                ),
                                _react2.default.createElement(
                                    Grid.Col,
                                    { all: 4 },
                                    _react2.default.createElement(Section, {
                                        title: t(_templateObject4),
                                        icon: "fa-lock"
                                    }),
                                    _react2.default.createElement(
                                        Data,
                                        {
                                            api: "/entities/webiny/user/2factor-recovery-codes",
                                            waitForData: true
                                        },
                                        function(_ref) {
                                            var data = _ref.data;
                                            return _react2.default.createElement(
                                                "pre",
                                                null,
                                                data.recoveryCodes
                                            );
                                        }
                                    )
                                ),
                                _react2.default.createElement(
                                    Grid.Col,
                                    { all: 8 },
                                    _react2.default.createElement(Section, {
                                        title: t(_templateObject5),
                                        icon: "fa-exclamation"
                                    }),
                                    _react2.default.createElement("p", null, t(_templateObject6)),
                                    _react2.default.createElement("p", null, t(_templateObject7))
                                )
                            )
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            { clasName: "text-center" },
                            _react2.default.createElement(Button, {
                                type: "primary",
                                label: t(_templateObject8),
                                onClick: this.hide
                            })
                        )
                    )
                );
            }
        }
    ]);
    return TwoFactorAuthConfirmation;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(TwoFactorAuthConfirmation, {
    modules: ["Modal", "Data", "Grid", "Alert", "Button", "Section"]
});
//# sourceMappingURL=TwoFactorAuthConfirmation.js.map
