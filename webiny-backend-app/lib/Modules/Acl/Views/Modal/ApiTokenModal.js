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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.Modal.ApiTokenModal
 */
var ApiTokenModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ApiTokenModal, _Webiny$Ui$ModalCompo);

    function ApiTokenModal() {
        (0, _classCallCheck3.default)(this, ApiTokenModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ApiTokenModal.__proto__ || Object.getPrototypeOf(ApiTokenModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ApiTokenModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Form = _props.Form,
                    Grid = _props.Grid,
                    Input = _props.Input,
                    Switch = _props.Switch,
                    Button = _props.Button,
                    Tabs = _props.Tabs,
                    UserRoles = _props.UserRoles,
                    UserRoleGroups = _props.UserRoleGroups;

                var formProps = {
                    api: "/entities/webiny/api-token",
                    fields: "*,roles[id],roleGroups[id]",
                    id: _lodash2.default.get(this.props.data, "id"),
                    onSubmitSuccess: function onSubmitSuccess() {
                        _this2.props.refreshTokens();
                        _this2.hide();
                    },
                    onSuccessMessage: function onSuccessMessage() {
                        return "Token was saved successfully!";
                    },
                    defaultModel: this.props.data
                };

                return _react2.default.createElement(Modal.Dialog, { wide: true }, function(_ref) {
                    var dialog = _ref.dialog;
                    return _react2.default.createElement(Form, formProps, function(_ref2) {
                        var model = _ref2.model,
                            form = _ref2.form;
                        return _react2.default.createElement(
                            Modal.Content,
                            null,
                            _react2.default.createElement(Form.Loader, null),
                            _react2.default.createElement(Modal.Header, {
                                title: _this2.i18n("API Token"),
                                onClose: dialog.hide
                            }),
                            _react2.default.createElement(
                                Modal.Body,
                                null,
                                _react2.default.createElement(
                                    Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Form.Error, null),
                                        _react2.default.createElement(Input, {
                                            readOnly: true,
                                            label: _this2.i18n("Token"),
                                            name: "token",
                                            renderIf: function renderIf() {
                                                return model.id;
                                            }
                                        }),
                                        _react2.default.createElement(Input, {
                                            label: _this2.i18n("Owner"),
                                            name: "owner",
                                            validate: "required",
                                            placeholder: _this2.i18n("Eg: webiny.com")
                                        }),
                                        _react2.default.createElement(Input, {
                                            label: _this2.i18n("Description"),
                                            name: "description",
                                            validate: "required",
                                            description: _react2.default.createElement(
                                                "span",
                                                null,
                                                _this2.i18n(
                                                    "Try to keep it short, for example: {example}",
                                                    {
                                                        example: _react2.default.createElement(
                                                            "strong",
                                                            null,
                                                            "Project X - Issue tracker"
                                                        )
                                                    }
                                                )
                                            ),
                                            placeholder: _this2.i18n("Short description of usage")
                                        }),
                                        _react2.default.createElement(Switch, {
                                            label: _this2.i18n("Enabled"),
                                            name: "enabled"
                                        }),
                                        _react2.default.createElement(Switch, {
                                            label: _this2.i18n("Log requests"),
                                            name: "logRequests"
                                        })
                                    )
                                ),
                                _react2.default.createElement("br", null),
                                _react2.default.createElement(
                                    Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(
                                            Tabs,
                                            null,
                                            _react2.default.createElement(
                                                Tabs.Tab,
                                                { label: _this2.i18n("Roles"), icon: "fa-user" },
                                                _react2.default.createElement(UserRoles, {
                                                    name: "roles"
                                                })
                                            ),
                                            _react2.default.createElement(
                                                Tabs.Tab,
                                                {
                                                    label: _this2.i18n("Role Groups"),
                                                    icon: "fa-users"
                                                },
                                                _react2.default.createElement(UserRoleGroups, {
                                                    name: "roleGroups"
                                                })
                                            )
                                        )
                                    )
                                )
                            ),
                            _react2.default.createElement(
                                Modal.Footer,
                                null,
                                _react2.default.createElement(Button, {
                                    label: _this2.i18n("Cancel"),
                                    onClick: _this2.hide
                                }),
                                _react2.default.createElement(Button, {
                                    type: "primary",
                                    label: _this2.i18n("Save token"),
                                    onClick: form.submit
                                })
                            )
                        );
                    });
                });
            }
        }
    ]);
    return ApiTokenModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(ApiTokenModal, {
    modules: [
        "Modal",
        "Form",
        "Grid",
        "Input",
        "Switch",
        "Button",
        "Tabs",
        {
            UserRoles: "Webiny/Backend/UserRoles",
            UserRoleGroups: "Webiny/Backend/UserRoleGroups"
        }
    ]
});
//# sourceMappingURL=ApiTokenModal.js.map
