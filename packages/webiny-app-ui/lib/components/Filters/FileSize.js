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

var _filesize = require("filesize");

var _filesize2 = _interopRequireDefault(_filesize);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var FileSize = (function(_React$Component) {
    (0, _inherits3.default)(FileSize, _React$Component);

    function FileSize() {
        (0, _classCallCheck3.default)(this, FileSize);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (FileSize.__proto__ || Object.getPrototypeOf(FileSize)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(FileSize, [
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    "span",
                    null,
                    (0, _filesize2.default)(this.props.value, this.props.options)
                );
            }
        }
    ]);
    return FileSize;
})(_react2.default.Component);

FileSize.defaultProps = {
    options: {}
};

exports.default = (0, _webinyApp.createComponent)(FileSize);
//# sourceMappingURL=FileSize.js.map
