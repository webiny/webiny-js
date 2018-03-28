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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Email = (function(_React$Component) {
    (0, _inherits3.default)(Email, _React$Component);

    function Email() {
        (0, _classCallCheck3.default)(this, Email);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Email.__proto__ || Object.getPrototypeOf(Email)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Email, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    render = _props.render,
                    Input = _props.Input,
                    props = (0, _objectWithoutProperties3.default)(_props, ["render", "Input"]);

                if (render) {
                    return render.call(this);
                }

                if (props.onChange) {
                    props.onChange = function(value, cb) {
                        return _this2.props.onChange(
                            value ? value.toLowerCase().trim() : value,
                            cb
                        );
                    };
                }

                return _react2.default.createElement(Input, props);
            }
        }
    ]);
    return Email;
})(_react2.default.Component);

Email.defaultProps = {
    defaultValidators: "email"
};

exports.default = (0, _webinyApp.createComponent)(Email, {
    modules: ["Input"],
    formComponent: true
});
//# sourceMappingURL=index.js.map
