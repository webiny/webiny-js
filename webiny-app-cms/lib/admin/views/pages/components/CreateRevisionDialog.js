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

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CreateRevisionDialog = (function(_React$Component) {
    (0, _inherits3.default)(CreateRevisionDialog, _React$Component);

    function CreateRevisionDialog() {
        (0, _classCallCheck3.default)(this, CreateRevisionDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CreateRevisionDialog.__proto__ || Object.getPrototypeOf(CreateRevisionDialog)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(CreateRevisionDialog, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    page = _props.page,
                    data = _props.data,
                    _props$modules = _props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button,
                    Form = _props$modules.Form,
                    FormData = _props$modules.FormData,
                    FormError = _props$modules.FormError,
                    Input = _props$modules.Input,
                    Loader = _props$modules.Loader,
                    hide = _props.hide;

                var newModel = (0, _pick3.default)(data.source, ["title", "slug", "content"]);
                newModel.name = "Revision #" + (page.revisions.length + 1);
                newModel.page = page.id;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        FormData,
                        {
                            defaultModel: newModel,
                            entity: "CmsRevision",
                            fields: "id",
                            onSubmitSuccess: function onSubmitSuccess(_ref) {
                                var model = _ref.model;
                                return _webinyApp.app.router.goToRoute("Cms.Page.Editor", {
                                    id: model.id
                                });
                            }
                        },
                        function(_ref2) {
                            var model = _ref2.model,
                                onSubmit = _ref2.onSubmit,
                                loading = _ref2.loading,
                                error = _ref2.error;
                            return _react2.default.createElement(
                                Form,
                                { model: model, onSubmit: onSubmit },
                                function(_ref3) {
                                    var model = _ref3.model,
                                        form = _ref3.form,
                                        Bind = _ref3.Bind;
                                    return _react2.default.createElement(
                                        Modal.Content,
                                        null,
                                        loading && _react2.default.createElement(Loader, null),
                                        _react2.default.createElement(Modal.Header, {
                                            title: "Create a revision",
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
                                                Bind,
                                                null,
                                                _react2.default.createElement(Input, {
                                                    autoFocus: true,
                                                    label: "Revision name",
                                                    validators: "required",
                                                    placeholder: "Enter a revision name",
                                                    name: "name"
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
                                                label: "Create",
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
    return CreateRevisionDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(
    [CreateRevisionDialog, _webinyAppUi.ModalComponent],
    {
        modules: ["Modal", "Button", "Form", "FormData", "FormError", "Input", "Loader"]
    }
);
//# sourceMappingURL=CreateRevisionDialog.js.map
