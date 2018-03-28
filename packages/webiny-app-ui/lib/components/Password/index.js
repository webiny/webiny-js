"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Show content"], ["Show content"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Hide content"], ["Hide content"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Password");

var Password = (function(_React$Component) {
    (0, _inherits3.default)(Password, _React$Component);

    function Password(props) {
        (0, _classCallCheck3.default)(this, Password);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Password.__proto__ || Object.getPrototypeOf(Password)).call(this, props)
        );

        _this.state = {
            showPassword: false,
            icon: "fa-eye",
            msg: t(_templateObject)
        };

        _this.togglePassword = _this.togglePassword.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Password, [
        {
            key: "togglePassword",
            value: function togglePassword() {
                if (this.state.showPassword === true) {
                    this.setState({
                        showPassword: false,
                        icon: "fa-eye",
                        msg: t(_templateObject)
                    });
                } else {
                    this.setState({
                        showPassword: true,
                        icon: "fa-eye-slash",
                        msg: t(_templateObject2)
                    });
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    render = _props.render,
                    props = (0, _objectWithoutProperties3.default)(_props, ["render"]);

                if (render) {
                    return render.call(this);
                }

                var Icon = props.Icon,
                    Input = props.Input,
                    Link = props.Link;

                props.info = _react2.default.createElement(
                    Link,
                    { tabIndex: "-1", onClick: this.togglePassword },
                    _react2.default.createElement(Icon, { icon: this.state.icon }),
                    " ",
                    this.state.msg
                );
                props.type = this.state.showPassword ? "text" : "password";

                return _react2.default.createElement(Input, props);
            }
        }
    ]);
    return Password;
})(_react2.default.Component);

Password.defaultProps = {
    defaultValidate: "password"
};

exports.default = (0, _webinyApp.createComponent)(Password, {
    modules: ["Link", "Icon", "Input"],
    formComponent: true
});
//# sourceMappingURL=index.js.map
