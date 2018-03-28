"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Confirmation dialog"],
        ["Confirmation dialog"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Yes"], ["Yes"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["No"], ["No"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _Dialog = require("./Dialog");

var _Dialog2 = _interopRequireDefault(_Dialog);

var _Content = require("./Content");

var _Content2 = _interopRequireDefault(_Content);

var _Body = require("./Body");

var _Body2 = _interopRequireDefault(_Body);

var _Footer = require("./Footer");

var _Footer2 = _interopRequireDefault(_Footer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Modal.Confirmation");

var Confirmation = (function(_React$Component) {
    (0, _inherits3.default)(Confirmation, _React$Component);

    function Confirmation() {
        (0, _classCallCheck3.default)(this, Confirmation);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Confirmation.__proto__ || Object.getPrototypeOf(Confirmation)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Confirmation, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Loader = _props.Loader,
                    Button = _props.Button,
                    styles = _props.styles,
                    title = _props.title,
                    render = _props.render;

                if (render) {
                    return render.call(this);
                }

                var content = this.props.message || this.props.children;
                if ((0, _isFunction3.default)(content)) {
                    content = content({ data: this.props.data });
                }

                return _react2.default.createElement(
                    _Dialog2.default,
                    {
                        modalContainerTag: "confirmation-modal",
                        className: styles.alertModal,
                        onCancel: this.props.onCancel,
                        closeOnClick: this.props.closeOnClick
                    },
                    this.props.loading && _react2.default.createElement(Loader, null),
                    _react2.default.createElement(
                        _Content2.default,
                        null,
                        _react2.default.createElement(
                            _Body2.default,
                            null,
                            _react2.default.createElement(
                                "div",
                                { className: "text-center" },
                                _react2.default.createElement("h4", null, title),
                                _react2.default.createElement("p", null, content)
                            )
                        ),
                        _react2.default.createElement(
                            _Footer2.default,
                            null,
                            _react2.default.createElement(Button, {
                                type: "default",
                                label: this.props.cancel,
                                onClick: this.props.onCancel
                            }),
                            _react2.default.createElement(Button, {
                                type: "primary",
                                label: this.props.confirm,
                                onClick: this.props.onConfirm
                            })
                        )
                    )
                );
            }
        }
    ]);
    return Confirmation;
})(_react2.default.Component);

Confirmation.defaultProps = {
    title: t(_templateObject),
    confirm: t(_templateObject2),
    cancel: t(_templateObject3)
};

exports.default = (0, _webinyApp.createComponent)(
    [Confirmation, _webinyAppUi.ModalConfirmationComponent],
    {
        modules: ["Button", "Loader"]
    }
);
//# sourceMappingURL=Confirmation.js.map
