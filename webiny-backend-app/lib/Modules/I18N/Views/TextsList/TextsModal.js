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
 * @i18n.namespace  Webiny.Backend.I18N.TranslationModal
 */
var TranslationModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(TranslationModal, _Webiny$Ui$ModalCompo);

    function TranslationModal() {
        (0, _classCallCheck3.default)(this, TranslationModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TranslationModal.__proto__ || Object.getPrototypeOf(TranslationModal)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(TranslationModal, [
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
                            id: _lodash2.default.get(this.props.data, "id"),
                            api: "/entities/webiny/i18n-texts",
                            fields: "*,translations,group",
                            onSuccessMessage: function onSuccessMessage() {
                                return _this2.i18n("Text was successfully saved!");
                            },
                            onSubmitSuccess: function onSubmitSuccess() {
                                return _this2.hide().then(_this2.props.onTextsSaved);
                            }
                        },
                        function(_ref) {
                            var model = _ref.model,
                                form = _ref.form;

                            var id = _lodash2.default.get(_this2.props, "data.id");
                            return _react2.default.createElement(
                                Ui.Modal.Content,
                                null,
                                _react2.default.createElement(Ui.Form.Loader, null),
                                _react2.default.createElement(Ui.Modal.Header, {
                                    title: id
                                        ? _this2.i18n("Edit Text")
                                        : _this2.i18n("Create Text"),
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
                                                label: _this2.i18n("Key"),
                                                name: "key",
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
                                            _react2.default.createElement(Ui.Textarea, {
                                                label: _this2.i18n("Base text"),
                                                name: "base",
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
                                            _react2.default.createElement(Ui.Select, {
                                                filterBy: "app",
                                                disabled: !model.app,
                                                label: _this2.i18n("Text group"),
                                                api: "/entities/webiny/i18n-text-groups",
                                                name: "group",
                                                textAttr: "name",
                                                valueAttr: "id",
                                                placeholder: _this2.i18n("Optional"),
                                                allowClear: true
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
    return TranslationModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

TranslationModal.defaultProps = _webinyClient.Webiny.Ui.ModalComponent.extendProps({
    data: null,
    onTextsSaved: _lodash2.default.noop
});

exports.default = _webinyClient.Webiny.createComponent(TranslationModal, {
    modulesProp: "Ui",
    modules: ["Modal", "Form", "Grid", "Input", "Textarea", "Button", "Select", "Section"]
});
//# sourceMappingURL=TextsModal.js.map
