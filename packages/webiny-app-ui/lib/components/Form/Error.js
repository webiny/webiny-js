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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ContainerError = (function(_React$Component) {
    (0, _inherits3.default)(ContainerError, _React$Component);

    function ContainerError() {
        (0, _classCallCheck3.default)(this, ContainerError);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ContainerError.__proto__ || Object.getPrototypeOf(ContainerError)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ContainerError, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    error = _props.error,
                    onClose = _props.onClose,
                    close = _props.close,
                    title = _props.title,
                    type = _props.type,
                    className = _props.className,
                    message = _props.message;

                if (!error) {
                    return null;
                }

                if ((0, _isFunction3.default)(this.props.children)) {
                    return this.props.children({ error: error });
                }

                var Alert = this.props.Alert;

                if ((0, _isString3.default)(error)) {
                    return _react2.default.createElement(
                        Alert,
                        { title: title, type: type, close: close },
                        error
                    );
                }

                var data = [];
                (0, _each3.default)(error.data.data, function(value, key) {
                    data.push(
                        _react2.default.createElement(
                            "li",
                            { key: key },
                            _react2.default.createElement("strong", null, key),
                            " ",
                            value
                        )
                    );
                });

                return _react2.default.createElement(
                    Alert,
                    {
                        title: title,
                        type: type,
                        close: close,
                        onClose: onClose,
                        className: className
                    },
                    message || error.data.message,
                    data.length > 0 && _react2.default.createElement("ul", null, data)
                );
            }
        }
    ]);
    return ContainerError;
})(_react2.default.Component);

ContainerError.defaultProps = {
    error: null,
    title: "Oops",
    type: "error",
    message: null,
    className: null,
    close: true,
    onClose: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(ContainerError, { modules: ["Alert"] });
//# sourceMappingURL=Error.js.map
