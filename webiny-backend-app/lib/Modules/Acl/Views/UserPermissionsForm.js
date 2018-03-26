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

var _EntityPermissions = require("./Components/EntityPermissions");

var _EntityPermissions2 = _interopRequireDefault(_EntityPermissions);

var _ServicePermissions = require("./Components/ServicePermissions");

var _ServicePermissions2 = _interopRequireDefault(_ServicePermissions);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.UserPermissionsForm
 */
var UserPermissionsForm = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UserPermissionsForm, _Webiny$Ui$View);

    function UserPermissionsForm(props) {
        (0, _classCallCheck3.default)(this, UserPermissionsForm);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UserPermissionsForm.__proto__ || Object.getPrototypeOf(UserPermissionsForm)).call(
                this,
                props
            )
        );

        _this.state = {};
        return _this;
    }

    (0, _createClass3.default)(UserPermissionsForm, [
        {
            key: "onToggle",
            value: function onToggle(model, form, classId, method) {
                var pIndex = _lodash2.default.findIndex(model.permissions, { classId: classId });

                var rules = model.permissions[pIndex].rules;
                _lodash2.default.set(rules, method, !_lodash2.default.get(rules, method));

                model.permissions[pIndex].rules = rules;
                form.setState({ model: model });
            }
        },
        {
            key: "onAdd",
            value: function onAdd(model, form, resource) {
                model.permissions.push({
                    classId: resource.classId,
                    rules: {}
                });
                form.setState({ model: model });
            }
        },
        {
            key: "onRemove",
            value: function onRemove(model, form, resource) {
                var pIndex = _lodash2.default.findIndex(model.permissions, {
                    classId: resource.classId
                });
                model.permissions.splice(pIndex, 1);
                form.setState({ model: model });
            }
        },
        {
            key: "renderView",
            value: function renderView(Ui) {
                var _this2 = this;

                var newUserPermission = !_webinyClient.Webiny.Router.getParams("id");

                return _react2.default.createElement(
                    Ui.Form,
                    {
                        api: "/entities/webiny/user-permissions",
                        fields: "id,name,slug,description,permissions",
                        connectToRouter: true,
                        onSubmitSuccess: "UserPermissions.List",
                        onCancel: "UserPermissions.List",
                        defaultModel: { permissions: [] },
                        onSuccessMessage: function onSuccessMessage(_ref) {
                            var model = _ref.model;

                            return _react2.default.createElement(
                                "span",
                                null,
                                _this2.i18n("Permission {permission} was saved successfully!", {
                                    permission: _react2.default.createElement(
                                        "strong",
                                        null,
                                        model.name
                                    )
                                })
                            );
                        }
                    },
                    function(_ref2) {
                        var model = _ref2.model,
                            form = _ref2.form;

                        return _react2.default.createElement(
                            Ui.View.Form,
                            null,
                            _react2.default.createElement(Ui.View.Header, {
                                title: model.id
                                    ? _this2.i18n("ACL - Edit permission")
                                    : _this2.i18n("ACL - Create permission")
                            }),
                            _react2.default.createElement(
                                Ui.View.Body,
                                null,
                                _react2.default.createElement(Ui.Section, {
                                    title: _this2.i18n("General")
                                }),
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Ui.Input, {
                                            label: _this2.i18n("Name"),
                                            name: "name",
                                            validate: "required"
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Ui.Input, {
                                            label: _this2.i18n("Slug"),
                                            name: "slug"
                                        })
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Ui.Input, {
                                            label: _this2.i18n("Description"),
                                            name: "description",
                                            validate: "required"
                                        }),
                                        _react2.default.createElement(
                                            Ui.Tabs,
                                            null,
                                            _react2.default.createElement(
                                                Ui.Tabs.Tab,
                                                { label: _this2.i18n("Entities") },
                                                (newUserPermission || model.id) &&
                                                    _react2.default.createElement(
                                                        _EntityPermissions2.default,
                                                        {
                                                            model: model,
                                                            onTogglePermission: function onTogglePermission(
                                                                classId,
                                                                method
                                                            ) {
                                                                return _this2.onToggle(
                                                                    model,
                                                                    form,
                                                                    classId,
                                                                    method
                                                                );
                                                            },
                                                            onAddEntity: function onAddEntity(
                                                                resource
                                                            ) {
                                                                return _this2.onAdd(
                                                                    model,
                                                                    form,
                                                                    resource
                                                                );
                                                            },
                                                            onRemoveEntity: function onRemoveEntity(
                                                                resource
                                                            ) {
                                                                return _this2.onRemove(
                                                                    model,
                                                                    form,
                                                                    resource
                                                                );
                                                            }
                                                        }
                                                    )
                                            ),
                                            _react2.default.createElement(
                                                Ui.Tabs.Tab,
                                                { label: _this2.i18n("Services") },
                                                (newUserPermission || model.id) &&
                                                    _react2.default.createElement(
                                                        _ServicePermissions2.default,
                                                        {
                                                            model: model,
                                                            onTogglePermission: function onTogglePermission(
                                                                classId,
                                                                method
                                                            ) {
                                                                return _this2.onToggle(
                                                                    model,
                                                                    form,
                                                                    classId,
                                                                    method
                                                                );
                                                            },
                                                            onAddService: function onAddService(
                                                                resource
                                                            ) {
                                                                return _this2.onAdd(
                                                                    model,
                                                                    form,
                                                                    resource
                                                                );
                                                            },
                                                            onRemoveService: function onRemoveService(
                                                                resource
                                                            ) {
                                                                return _this2.onRemove(
                                                                    model,
                                                                    form,
                                                                    resource
                                                                );
                                                            }
                                                        }
                                                    )
                                            )
                                        )
                                    )
                                )
                            ),
                            _react2.default.createElement(
                                Ui.View.Footer,
                                null,
                                _react2.default.createElement(Ui.Button, {
                                    type: "default",
                                    onClick: form.cancel,
                                    label: _this2.i18n("Go back")
                                }),
                                _react2.default.createElement(Ui.Button, {
                                    type: "primary",
                                    onClick: form.submit,
                                    label: _this2.i18n("Save permission"),
                                    align: "right"
                                })
                            )
                        );
                    }
                );
            }
        }
    ]);
    return UserPermissionsForm;
})(_webinyClient.Webiny.Ui.View);

UserPermissionsForm.defaultProps = {
    renderer: function renderer() {
        var _this3 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            {
                modules: [
                    "Form",
                    "Section",
                    "View",
                    "Grid",
                    "Tabs",
                    "Input",
                    "Label",
                    "Button",
                    "Switch"
                ]
            },
            function(Ui) {
                return _this3.renderView(Ui);
            }
        );
    }
};

exports.default = UserPermissionsForm;
//# sourceMappingURL=UserPermissionsForm.js.map
