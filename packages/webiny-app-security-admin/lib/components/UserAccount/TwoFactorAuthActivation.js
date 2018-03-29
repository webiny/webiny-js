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
        ["The code doesn't match"],
        ["The code doesn't match"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["2Factor Auth"], ["2Factor Auth"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["Step 1"], ["Step 1"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(
        ["Install the Google Authenticator iOS or Android app:"],
        ["Install the Google Authenticator iOS or Android app:"]
    ),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["iOS download"], ["iOS download"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(
        ["Android download"],
        ["Android download"]
    ),
    _templateObject7 = (0, _taggedTemplateLiteral3.default)(["Step 2"], ["Step 2"]),
    _templateObject8 = (0, _taggedTemplateLiteral3.default)(
        ["Scan the QR code below with the authenticator app"],
        ["Scan the QR code below with the authenticator app"]
    ),
    _templateObject9 = (0, _taggedTemplateLiteral3.default)(["Step 3"], ["Step 3"]),
    _templateObject10 = (0, _taggedTemplateLiteral3.default)(
        ["Enter the generated code in the field below:"],
        ["Enter the generated code in the field below:"]
    ),
    _templateObject11 = (0, _taggedTemplateLiteral3.default)(["Cancel"], ["Cancel"]),
    _templateObject12 = (0, _taggedTemplateLiteral3.default)(["Verify"], ["Verify"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.UserAccount.TwoFactorAuthActivation");

var TwoFactorAuthActivation = (function(_React$Component) {
    (0, _inherits3.default)(TwoFactorAuthActivation, _React$Component);

    function TwoFactorAuthActivation() {
        (0, _classCallCheck3.default)(this, TwoFactorAuthActivation);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (
                TwoFactorAuthActivation.__proto__ || Object.getPrototypeOf(TwoFactorAuthActivation)
            ).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TwoFactorAuthActivation, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Ui = _props.Ui,
                    onCancel = _props.onCancel,
                    onConfirm = _props.onConfirm;

                var formProps = {
                    api: "/security/auth/2factor-verify",
                    fields: "id,title",
                    onSuccessMessage: null,
                    onSubmitSuccess: function onSubmitSuccess(_ref) {
                        var response = _ref.response;

                        if (response.data.data.result) {
                            onConfirm();
                        } else {
                            _webinyApp.app.services.get("growler").danger(t(_templateObject));
                        }
                    }
                };

                return _react2.default.createElement(
                    Ui.Modal.Dialog,
                    null,
                    _react2.default.createElement(Ui.Form, formProps, function(_ref2) {
                        var form = _ref2.form;
                        return _react2.default.createElement(
                            Ui.Modal.Content,
                            null,
                            _react2.default.createElement(Ui.Modal.Header, {
                                title: t(_templateObject2),
                                onClose: onCancel
                            }),
                            _react2.default.createElement(
                                Ui.Modal.Body,
                                null,
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Ui.Section, {
                                            title: t(_templateObject3)
                                        }),
                                        _react2.default.createElement(
                                            "p",
                                            null,
                                            t(_templateObject4),
                                            _react2.default.createElement("br", null)
                                        ),
                                        _react2.default.createElement(
                                            "p",
                                            null,
                                            _react2.default.createElement(
                                                Ui.Link,
                                                {
                                                    url:
                                                        "https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8"
                                                },
                                                _react2.default.createElement(Ui.Icon, {
                                                    icon: "fa-apple"
                                                }),
                                                " ",
                                                t(_templateObject5)
                                            ),
                                            _react2.default.createElement("br", null),
                                            _react2.default.createElement(
                                                Ui.Link,
                                                {
                                                    url:
                                                        "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en"
                                                },
                                                _react2.default.createElement(Ui.Icon, {
                                                    icon: "fa-android"
                                                }),
                                                " ",
                                                t(_templateObject6)
                                            )
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Ui.Section, {
                                            title: t(_templateObject7)
                                        }),
                                        _react2.default.createElement(
                                            "p",
                                            null,
                                            t(_templateObject8)
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Ui.Section, {
                                            title: t(_templateObject9)
                                        }),
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Input, {
                                                label: t(_templateObject10),
                                                name: "verification",
                                                validators: "required"
                                            })
                                        )
                                    )
                                )
                            ),
                            _react2.default.createElement(
                                Ui.Modal.Footer,
                                null,
                                _react2.default.createElement(Ui.Button, {
                                    type: "default",
                                    label: t(_templateObject11),
                                    onClick: onCancel
                                }),
                                _react2.default.createElement(Ui.Button, {
                                    type: "primary",
                                    label: t(_templateObject12),
                                    onClick: form.submit
                                })
                            )
                        );
                    })
                );
            }
        }
    ]);
    return TwoFactorAuthActivation;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(
    [TwoFactorAuthActivation, _webinyAppUi.ModalConfirmationComponent],
    {
        modulesProp: "Ui",
        modules: ["Modal", "Data", "Grid", "Button", "Section", "Form", "Input", "Link", "Icon"]
    }
);
//# sourceMappingURL=TwoFactorAuthActivation.js.map
