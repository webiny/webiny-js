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
 * @i18n.namespace  Webiny.Backend.I18N.TextGroupModal
 */
var TextGroupModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(TextGroupModal, _Webiny$Ui$ModalCompo);

    function TextGroupModal() {
        (0, _classCallCheck3.default)(this, TextGroupModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TextGroupModal.__proto__ || Object.getPrototypeOf(TextGroupModal)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(TextGroupModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var Ui = this.props.Ui;

                return _react2.default.createElement(
                    Ui.Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Ui.Form,
                        {
                            id: _lodash2.default.get(this.props, "data.id"),
                            api: "/entities/webiny/i18n-text-groups",
                            fields: "name,description,app",
                            onSuccessMessage: function onSuccessMessage() {
                                _this2.i18n("Text group saved successfully.");
                            },
                            onSubmitSuccess: function onSubmitSuccess() {
                                return _this2.hide().then(_this2.props.onSubmitSuccess);
                            }
                        },
                        function(_ref) {
                            var form = _ref.form;

                            var id = _lodash2.default.get(_this2.props, "data.id");
                            return _react2.default.createElement(
                                Ui.Modal.Content,
                                null,
                                _react2.default.createElement(Ui.Form.Loader, null),
                                _react2.default.createElement(Ui.Modal.Header, {
                                    title: id
                                        ? _this2.i18n("Edit text group")
                                        : _this2.i18n("Create text group"),
                                    onClose: _this2.hide
                                }),
                                _react2.default.createElement(
                                    Ui.Modal.Body,
                                    null,
                                    _react2.default.createElement(Ui.Form.Error, null),
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Input, {
                                                label: _this2.i18n("Name"),
                                                placeholder: _this2.i18n("Name of text group"),
                                                name: "name",
                                                validate: "required"
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Select, {
                                                label: _this2.i18n("App"),
                                                name: "app",
                                                api: "/services/webiny/apps",
                                                validate: "required",
                                                url: "/installed",
                                                textAttr: "name",
                                                valueAttr: "name",
                                                placeholder: _this2.i18n("Select an app..."),
                                                allowClear: true
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Textarea, {
                                                label: _this2.i18n("Description"),
                                                name: "description",
                                                placeholder: _this2.i18n("Short description...")
                                            })
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.Modal.Footer,
                                    null,
                                    _react2.default.createElement(Ui.Button, {
                                        label: _this2.i18n("Cancel"),
                                        onClick: _this2.hide
                                    }),
                                    _react2.default.createElement(Ui.Button, {
                                        type: "primary",
                                        label: _this2.i18n("Save"),
                                        onClick: form.submit
                                    })
                                )
                            );
                        }
                    )
                );
            }
        }
    ]);
    return TextGroupModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

TextGroupModal.defaultProps = _webinyClient.Webiny.Ui.ModalComponent.extendProps({
    data: null,
    onSubmitSuccess: _lodash2.default.noop
});

exports.default = _webinyClient.Webiny.createComponent(TextGroupModal, {
    modulesProp: "Ui",
    modules: ["Modal", "Form", "Grid", "Input", "Button", "Textarea", "Select"]
});
//# sourceMappingURL=TextGroupsModal.js.map
