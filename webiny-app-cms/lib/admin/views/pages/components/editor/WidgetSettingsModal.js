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

var MakeLocalDialog = (function(_React$Component) {
    (0, _inherits3.default)(MakeLocalDialog, _React$Component);

    function MakeLocalDialog() {
        (0, _classCallCheck3.default)(this, MakeLocalDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (MakeLocalDialog.__proto__ || Object.getPrototypeOf(MakeLocalDialog)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(MakeLocalDialog, [
        {
            key: "render",
            value: function render() {
                var _props$modules = this.props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            title: "Make widget global",
                            onClose: this.props.hide
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            "Your modal dialog content!"
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            { align: "right" },
                            _react2.default.createElement(Button, {
                                type: "default",
                                label: "Close",
                                onClick: this.props.hide
                            })
                        )
                    )
                );
            }
        }
    ]);
    return MakeLocalDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([MakeLocalDialog, _webinyAppUi.ModalComponent], {
    modules: ["Modal", "Button"]
});
//# sourceMappingURL=WidgetSettingsModal.js.map
