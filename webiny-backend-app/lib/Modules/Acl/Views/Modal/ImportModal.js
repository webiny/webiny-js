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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.Modal.ImportModal
 */
var ImportModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ImportModal, _Webiny$Ui$ModalCompo);

    function ImportModal() {
        (0, _classCallCheck3.default)(this, ImportModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImportModal.__proto__ || Object.getPrototypeOf(ImportModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ImportModal, [
        {
            key: "submit",
            value: function submit(_ref) {
                var model = _ref.model,
                    form = _ref.form;

                var data = JSON.parse(model.data);
                return form.onSubmit(data);
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Form = _props.Form,
                    CodeEditor = _props.CodeEditor,
                    Button = _props.Button,
                    api = _props.api,
                    label = _props.label;

                var formProps = {
                    api: api,
                    onSuccessMessage: function onSuccessMessage(_ref2) {
                        var model = _ref2.model;
                        return _react2.default.createElement(
                            "span",
                            null,
                            label,
                            " ",
                            _react2.default.createElement("strong", null, model.name),
                            " was imported!"
                        );
                    },
                    onSubmit: this.submit,
                    onSubmitSuccess: function onSubmitSuccess() {
                        return _this2.hide().then(_this2.props.onImported);
                    }
                };

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(Form, formProps, function(_ref3) {
                        var form = _ref3.form;
                        return _react2.default.createElement(
                            Modal.Content,
                            null,
                            _react2.default.createElement(Form.Loader, null),
                            _react2.default.createElement(Modal.Header, {
                                title: _this2.i18n("Import {label}", { label: label }),
                                onClose: _this2.hide
                            }),
                            _react2.default.createElement(
                                Modal.Body,
                                null,
                                _react2.default.createElement(Form.Error, null),
                                _react2.default.createElement(CodeEditor, {
                                    mode: "text/javascript",
                                    name: "data",
                                    validate: "required,json"
                                })
                            ),
                            _react2.default.createElement(
                                Modal.Footer,
                                null,
                                _react2.default.createElement(Button, {
                                    label: _this2.i18n("Import"),
                                    type: "primary",
                                    onClick: form.submit
                                })
                            )
                        );
                    })
                );
            }
        }
    ]);
    return ImportModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

ImportModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps,
    {
        api: "",
        label: "",
        onImported: _lodash2.default.noop
    }
);

exports.default = _webinyClient.Webiny.createComponent(ImportModal, {
    modules: ["Form", "Modal", "CodeEditor", "Button"]
});
//# sourceMappingURL=ImportModal.js.map
