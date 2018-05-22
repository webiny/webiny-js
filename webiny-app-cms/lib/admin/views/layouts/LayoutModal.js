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

var LayoutModal = (function(_React$Component) {
    (0, _inherits3.default)(LayoutModal, _React$Component);

    function LayoutModal() {
        (0, _classCallCheck3.default)(this, LayoutModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (LayoutModal.__proto__ || Object.getPrototypeOf(LayoutModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(LayoutModal, [
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
                            entity: "CmsLayout",
                            fields: "id title slug",
                            onSubmitSuccess: function onSubmitSuccess(_ref) {
                                var model = _ref.model;

                                _this2.props.hide().then(function() {
                                    return app.router.goToRoute("Cms.Layout.Edit", {
                                        id: model.id
                                    });
                                });
                            }
                        },
                        function(_ref2) {
                            var model = _ref2.model,
                                onSubmit = _ref2.onSubmit,
                                error = _ref2.error,
                                loading = _ref2.loading,
                                invalidFields = _ref2.invalidFields;
                            return _react2.default.createElement(
                                Form,
                                { model: model, onSubmit: onSubmit, invalidFields: invalidFields },
                                function(_ref3) {
                                    var form = _ref3.form,
                                        Bind = _ref3.Bind;
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
                                                            placeholder: "Enter layout title",
                                                            validators: "required"
                                                        })
                                                    ),
                                                    _react2.default.createElement(
                                                        Bind,
                                                        null,
                                                        _react2.default.createElement(Input, {
                                                            label: "Slug",
                                                            name: "slug",
                                                            placeholder: "Enter layout slug",
                                                            validators: "required"
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
    return LayoutModal;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([LayoutModal, _webinyAppUi.ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form", "FormData", "FormError", "Grid", "Loader"]
});
//# sourceMappingURL=LayoutModal.js.map
