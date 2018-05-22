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

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _slugify = require("slugify");

var _slugify2 = _interopRequireDefault(_slugify);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CreatePageDialog = (function(_React$Component) {
    (0, _inherits3.default)(CreatePageDialog, _React$Component);

    function CreatePageDialog() {
        (0, _classCallCheck3.default)(this, CreatePageDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CreatePageDialog.__proto__ || Object.getPrototypeOf(CreatePageDialog)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(CreatePageDialog, [
        {
            key: "generateSlug",
            value: function generateSlug(_ref) {
                var form = _ref.form,
                    model = _ref.model;

                if (!model.title) {
                    return;
                }

                form.setState(function(_ref2) {
                    var model = _ref2.model;

                    return {
                        model: Object.assign({}, model, {
                            slug: (0, _slugify2.default)(model.title, {
                                remove: /[$#*_+~.()'"!\-:@]/g,
                                lower: true
                            })
                        })
                    };
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button,
                    Form = _props$modules.Form,
                    FormData = _props$modules.FormData,
                    FormError = _props$modules.FormError,
                    OptionsData = _props$modules.OptionsData,
                    Select = _props$modules.Select,
                    Input = _props$modules.Input,
                    Loader = _props$modules.Loader,
                    Icon = _props$modules.Icon,
                    Link = _props$modules.Link,
                    hide = _props.hide;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        FormData,
                        {
                            entity: "CmsPage",
                            fields: "activeRevision { id }",
                            onSubmitSuccess: function onSubmitSuccess(_ref3) {
                                var model = _ref3.model;
                                return _webinyApp.app.router.goToRoute("Cms.Page.Editor", {
                                    id: model.activeRevision.id
                                });
                            }
                        },
                        function(_ref4) {
                            var _onSubmit = _ref4.onSubmit,
                                loading = _ref4.loading,
                                error = _ref4.error;
                            return _react2.default.createElement(
                                Form,
                                {
                                    onSubmit: function onSubmit(model) {
                                        model.slug = model.category.url + model.slug;
                                        _onSubmit(model);
                                    }
                                },
                                function(_ref5) {
                                    var model = _ref5.model,
                                        form = _ref5.form,
                                        Bind = _ref5.Bind;
                                    return _react2.default.createElement(
                                        Modal.Content,
                                        null,
                                        loading && _react2.default.createElement(Loader, null),
                                        _react2.default.createElement(Modal.Header, {
                                            title: "Create page",
                                            onClose: hide
                                        }),
                                        _react2.default.createElement(
                                            Modal.Body,
                                            null,
                                            error &&
                                                _react2.default.createElement(FormError, {
                                                    error: error
                                                }),
                                            _react2.default.createElement(
                                                OptionsData,
                                                {
                                                    entity: "CmsCategory",
                                                    fields: "id title slug url",
                                                    labelField: "title",
                                                    perPage: 100
                                                },
                                                function(_ref6) {
                                                    var options = _ref6.options;
                                                    return _react2.default.createElement(
                                                        Bind,
                                                        null,
                                                        _react2.default.createElement(Select, {
                                                            useDataAsValue: true,
                                                            name: "category",
                                                            options: options,
                                                            placeholder: "Select a page category",
                                                            label: "Page category",
                                                            renderOption: function renderOption(
                                                                _ref7
                                                            ) {
                                                                var option = _ref7.option;
                                                                return _react2.default.createElement(
                                                                    "div",
                                                                    null,
                                                                    _react2.default.createElement(
                                                                        "strong",
                                                                        null,
                                                                        option.data.title
                                                                    ),
                                                                    _react2.default.createElement(
                                                                        "br",
                                                                        null
                                                                    ),
                                                                    _react2.default.createElement(
                                                                        "span",
                                                                        null,
                                                                        "URL:",
                                                                        " ",
                                                                        _react2.default.createElement(
                                                                            "strong",
                                                                            null,
                                                                            option.data.url
                                                                        )
                                                                    )
                                                                );
                                                            }
                                                        })
                                                    );
                                                }
                                            ),
                                            model.category &&
                                                _react2.default.createElement(
                                                    Bind,
                                                    null,
                                                    _react2.default.createElement(Input, {
                                                        label: "Page title",
                                                        validators: "required",
                                                        placeholder: "Enter a page title",
                                                        name: "title",
                                                        onBlur: function onBlur() {
                                                            if (
                                                                (0, _isEmpty3.default)(model.slug)
                                                            ) {
                                                                _this2.generateSlug({
                                                                    form: form,
                                                                    model: model
                                                                });
                                                            }
                                                        }
                                                    })
                                                ),
                                            model.category &&
                                                _react2.default.createElement(
                                                    Bind,
                                                    null,
                                                    _react2.default.createElement(Input, {
                                                        label: "Page slug",
                                                        placeholder: "Enter a page slug",
                                                        name: "slug",
                                                        addonLeft:
                                                            model.category && model.category.url,
                                                        addonRight: _react2.default.createElement(
                                                            Link,
                                                            {
                                                                onClick: function onClick() {
                                                                    return _this2.generateSlug({
                                                                        form: form,
                                                                        model: model
                                                                    });
                                                                }
                                                            },
                                                            _react2.default.createElement(Icon, {
                                                                icon: "sync-alt"
                                                            })
                                                        )
                                                    })
                                                )
                                        ),
                                        _react2.default.createElement(
                                            Modal.Footer,
                                            { align: "right" },
                                            _react2.default.createElement(Button, {
                                                type: "default",
                                                label: "Cancel",
                                                onClick: _this2.props.hide
                                            }),
                                            _react2.default.createElement(Button, {
                                                type: "primary",
                                                disabled: !model.category,
                                                label: "Create page",
                                                onClick: form.submit
                                            })
                                        )
                                    );
                                }
                            );
                        }
                    )
                );
            }
        }
    ]);
    return CreatePageDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([CreatePageDialog, _webinyAppUi.ModalComponent], {
    modules: [
        "Modal",
        "Button",
        "Form",
        "FormData",
        "FormError",
        "OptionsData",
        "Select",
        "Input",
        "Loader",
        "Icon",
        "Link"
    ]
});
//# sourceMappingURL=CreatePageDialog.js.map
