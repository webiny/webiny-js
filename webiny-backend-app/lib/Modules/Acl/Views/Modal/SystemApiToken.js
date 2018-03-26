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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.Modal.SystemApiTokenModal
 */
var SystemApiTokenModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(SystemApiTokenModal, _Webiny$Ui$ModalCompo);

    function SystemApiTokenModal(props) {
        (0, _classCallCheck3.default)(this, SystemApiTokenModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (SystemApiTokenModal.__proto__ || Object.getPrototypeOf(SystemApiTokenModal)).call(
                this,
                props
            )
        );

        _this.state = {
            confirmed: false
        };
        return _this;
    }

    (0, _createClass3.default)(SystemApiTokenModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Button = _props.Button,
                    Modal = _props.Modal,
                    Link = _props.Link,
                    Copy = _props.Copy,
                    Alert = _props.Alert,
                    Grid = _props.Grid,
                    Label = _props.Label;

                var showToken = _react2.default.createElement(Button, {
                    type: "primary",
                    label: this.i18n(
                        "I'm well aware of possible consequences of sharing this token. Reveal it!"
                    ),
                    onClick: function onClick() {
                        return _this2.setState({ confirmed: true });
                    }
                });

                if (this.state.confirmed) {
                    showToken = _react2.default.createElement(Copy.Input, {
                        value: this.props.token
                    });
                }

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            title: this.i18n("System API token")
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            _react2.default.createElement(
                                Alert,
                                { type: "info" },
                                this.i18n(
                                    "To grant access to your API to 3rd party clients, {createTokenLink}.",
                                    {
                                        createTokenLink: _react2.default.createElement(
                                            Link,
                                            {
                                                onClick: function onClick() {
                                                    return _this2.hide().then(function() {
                                                        return _this2.props.createToken();
                                                    });
                                                }
                                            },
                                            this.i18n("Create a new API token")
                                        )
                                    }
                                )
                            ),
                            _react2.default.createElement(
                                "p",
                                null,
                                this.i18n(
                                    "System API token allows its bearer to access resources exposed by your API."
                                ),
                                _react2.default.createElement("br", null),
                                this.i18n(
                                    "This system token is not meant to be shared, it is for your system only!"
                                ),
                                _react2.default.createElement("br", null),
                                _react2.default.createElement("br", null),
                                this.i18n(
                                    "Use it when you need to make internal API calls, by sending a {label} header.",
                                    {
                                        label: _react2.default.createElement(
                                            Label,
                                            { inline: true },
                                            "X-Webiny-Authorization"
                                        )
                                    }
                                )
                            ),
                            _react2.default.createElement(
                                Grid.Row,
                                null,
                                _react2.default.createElement(
                                    Grid.Col,
                                    { all: 12, className: "text-center" },
                                    showToken
                                )
                            )
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            null,
                            _react2.default.createElement(
                                Link,
                                {
                                    type: "default",
                                    align: "left",
                                    route: "ApiLogs.List",
                                    params: { token: "system" }
                                },
                                this.i18n("View logs")
                            ),
                            _react2.default.createElement(Button, {
                                label: this.i18n("Close"),
                                onClick: this.hide
                            })
                        )
                    )
                );
            }
        }
    ]);
    return SystemApiTokenModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(SystemApiTokenModal, {
    modules: ["Button", "Modal", "Link", "Copy", "Alert", "Grid", "Label"]
});
//# sourceMappingURL=SystemApiToken.js.map
