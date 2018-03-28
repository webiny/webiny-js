"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var CropperDialog = (function(_React$Component) {
    (0, _inherits3.default)(CropperDialog, _React$Component);

    function CropperDialog() {
        (0, _classCallCheck3.default)(this, CropperDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CropperDialog.__proto__ || Object.getPrototypeOf(CropperDialog)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(CropperDialog, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Modal = _props.Modal,
                    children = _props.children,
                    props = (0, _objectWithoutProperties3.default)(_props, ["Modal", "children"]);

                return _react2.default.createElement(Modal.Dialog, props, children);
            }
        }
    ]);
    return CropperDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([CropperDialog, _webinyAppUi.ModalComponent], {
    modules: ["Modal"]
});
//# sourceMappingURL=CropperDialog.js.map
