"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Back"], ["Back"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Wizard.Actions.Previous");

var Previous = (function(_React$Component) {
    (0, _inherits3.default)(Previous, _React$Component);

    function Previous() {
        (0, _classCallCheck3.default)(this, Previous);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Previous.__proto__ || Object.getPrototypeOf(Previous)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Previous, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Button = _props.Button,
                    render = _props.render,
                    wizard = _props.wizard,
                    onClick = _props.onClick,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "Button",
                        "render",
                        "wizard",
                        "onClick"
                    ]);

                if (render) {
                    return render.call(this);
                }

                if (wizard.isFirstStep()) {
                    return null;
                }

                var btnProps = Object.assign(
                    {
                        type: "default",
                        onClick: typeof onClick === "function" ? onClick : wizard.previousStep
                    },
                    props
                );

                return _react2.default.createElement(Button, btnProps);
            }
        }
    ]);
    return Previous;
})(_react2.default.Component);

// Receives all standard Button component props

Previous.defaultProps = {
    wizard: null,
    onClick: null,
    label: t(_templateObject)
};
exports.default = (0, _webinyApp.createComponent)(Previous, { modules: ["Button"] });
//# sourceMappingURL=Previous.js.map
