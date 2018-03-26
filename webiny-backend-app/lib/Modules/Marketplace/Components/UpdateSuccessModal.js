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
 * @i18n.namespace Webiny.Backend.Marketplace.UpdateSuccessModal
 */
var UpdateSuccessModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(UpdateSuccessModal, _Webiny$Ui$ModalCompo);

    function UpdateSuccessModal(props) {
        (0, _classCallCheck3.default)(this, UpdateSuccessModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UpdateSuccessModal.__proto__ || Object.getPrototypeOf(UpdateSuccessModal)).call(
                this,
                props
            )
        );

        _this.bindMethods("getButton");
        return _this;
    }

    (0, _createClass3.default)(UpdateSuccessModal, [
        {
            key: "getButton",
            value: function getButton(dialog) {
                var Button = this.props.Button;

                return _react2.default.createElement(Button, {
                    type: "secondary",
                    label: this.i18n("Reload window"),
                    icon: "fa-reload",
                    onClick: function onClick() {
                        return dialog.hide().then(function() {
                            return window.location.reload();
                        });
                    }
                });
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _props = this.props,
                    Modal = _props.Modal,
                    app = _props.app;

                return _react2.default.createElement(
                    Modal.Success,
                    {
                        closeBtn: this.getButton,
                        onClose: function onClose() {
                            return window.location.reload();
                        }
                    },
                    this.i18n("{appName} was updated successfully!", {
                        appName: _react2.default.createElement("strong", null, app.name)
                    }),
                    _react2.default.createElement("br", null),
                    _react2.default.createElement("br", null),
                    this.i18n("To see the changes you need to reload this browser window."),
                    _react2.default.createElement("br", null),
                    this.i18n("Click the button below to reload.")
                );
            }
        }
    ]);
    return UpdateSuccessModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(UpdateSuccessModal, {
    modules: ["Modal", "Button"]
});
//# sourceMappingURL=UpdateSuccessModal.js.map
