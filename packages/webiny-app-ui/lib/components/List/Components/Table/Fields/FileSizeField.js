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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _filesize = require("filesize");

var _filesize2 = _interopRequireDefault(_filesize);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var FileSizeField = (function(_React$Component) {
    (0, _inherits3.default)(FileSizeField, _React$Component);

    function FileSizeField() {
        (0, _classCallCheck3.default)(this, FileSizeField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (FileSizeField.__proto__ || Object.getPrototypeOf(FileSizeField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(FileSizeField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    List = _props.List,
                    render = _props.render,
                    options = _props.options,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "List",
                        "render",
                        "options"
                    ]);

                if (render) {
                    return render.call(this);
                }

                return _react2.default.createElement(List.Table.Field, props, function() {
                    return (0,
                    _filesize2.default)((0, _get3.default)(_this2.props.data, _this2.props.name), options);
                });
            }
        }
    ]);
    return FileSizeField;
})(_react2.default.Component);

FileSizeField.defaultProps = {
    options: {}
};

exports.default = (0, _webinyApp.createComponent)(FileSizeField, {
    modules: ["List"],
    tableField: true
});
//# sourceMappingURL=FileSizeField.js.map
