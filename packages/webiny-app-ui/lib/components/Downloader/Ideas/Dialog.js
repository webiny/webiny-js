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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Dialog = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(Dialog, _Webiny$Ui$Component);

    function Dialog() {
        (0, _classCallCheck3.default)(this, Dialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Dialog.__proto__ || Object.getPrototypeOf(Dialog)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Dialog, [
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate(prevProps, prevState) {
                (0, _get3.default)(
                    Dialog.prototype.__proto__ || Object.getPrototypeOf(Dialog.prototype),
                    "componentDidUpdate",
                    this
                ).call(this, prevProps, prevState);
                if (!prevProps.show && this.props.show) {
                    this.refs.dialog.show();
                }
            }
        }
    ]);
    return Dialog;
})(_webinyApp.Webiny.Ui.Component);

Dialog.defaultProps = {
    renderer: function renderer() {
        var dialogProps = {
            ref: "dialog",
            onHidden: this.props.onHidden
        };

        var funcParams = {
            download: this.props.download
        };

        return _react2.default.createElement(
            "webiny-download-dialog",
            null,
            _react2.default.cloneElement(this.props.renderDialog(funcParams), dialogProps)
        );
    }
};

exports.default = Dialog;
//# sourceMappingURL=Dialog.js.map
