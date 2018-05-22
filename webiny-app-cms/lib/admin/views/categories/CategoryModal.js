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

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var categoryURL = function categoryURL(value) {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Category URL must begin and end with a forward slash (`/`)");
};

var CategoryModal = (function(_React$Component) {
    (0, _inherits3.default)(CategoryModal, _React$Component);

    function CategoryModal() {
        (0, _classCallCheck3.default)(this, CategoryModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CategoryModal.__proto__ || Object.getPrototypeOf(CategoryModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(CategoryModal, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props$modules = this.props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button,
                    Form = _props$modules.Form,
                    FormData = _props$modules.FormData,
                    FormError = _props$modules.FormError,
                    Input = _props$modules.Input,
                    Grid = _props$modules.Grid,
                    Loader = _props$modules.Loader;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        FormData,
                        {
                            defaultModel: this.props.data || {},
                            entity: "CmsCategory",
                            fields: "id title slug url",
                            onSubmitSuccess: function onSubmitSuccess() {
                                _this2.props.hide().then(function() {
                                    return _this2.props.onSuccess();
                                });
                            }
                        },
                        function(_ref) {
                            var model = _ref.model,
                                onSubmit = _ref.onSubmit,
                                error = _ref.error,
                                loading = _ref.loading,
                                invalidFields = _ref.invalidFields;
                            return _react2.default.createElement(
                                Form,
                                { model: model, onSubmit: onSubmit, invalidFields: invalidFields },
                                function(_ref2) {
                                    var form = _ref2.form,
                                        Bind = _ref2.Bind;
                                    return _react2.default.createElement(
                                        Modal.Content,
                                        null,
                                        loading && _react2.default.createElement(Loader, null),
                                        _react2.default.createElement(Modal.Header, {
                                            title: "Category",
                                            onClose: _this2.props.hide
                                        }),
                                        _react2.default.createElement(
                                            Modal.Body,
                                            null,
                                            error &&
                                                _react2.default.createElement(FormError, {
                                                    error: error
                                                }),
                                            _react2.default.createElement(
                                                Grid.Row,
                                                null,
                                                _react2.default.createElement(
                                                    Grid.Col,
                                                    { all: 12 },
                                                    _react2.default.createElement(
                                                        Bind,
                                                        null,
                                                        _react2.default.createElement(Input, {
                                                            label: "Title",
                                                            name: "title",
                                                            placeholder: "Enter category title",
                                                            validators: "required"
                                                        })
                                                    ),
                                                    _react2.default.createElement(
                                                        Bind,
                                                        null,
                                                        _react2.default.createElement(Input, {
                                                            label: "Slug",
                                                            name: "slug",
                                                            placeholder: "Enter category slug",
                                                            validators: "required"
                                                        })
                                                    ),
                                                    _react2.default.createElement(
                                                        Bind,
                                                        null,
                                                        _react2.default.createElement(Input, {
                                                            label: "URL",
                                                            placeholder: "Enter category URL",
                                                            description:
                                                                "This URL will be added to all pages in this category.",
                                                            name: "url",
                                                            validators: ["required", categoryURL]
                                                        })
                                                    )
                                                )
                                            )
                                        ),
                                        _react2.default.createElement(
                                            Modal.Footer,
                                            null,
                                            _react2.default.createElement(Button, {
                                                type: "default",
                                                label: "Cancel",
                                                onClick: _this2.props.hide
                                            }),
                                            _react2.default.createElement(Button, {
                                                type: "primary",
                                                label: "Save",
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
    return CategoryModal;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([CategoryModal, _webinyAppUi.ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form", "FormData", "FormError", "Grid", "Loader"]
});
//# sourceMappingURL=CategoryModal.js.map
