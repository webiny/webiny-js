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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Awesome!"], ["Awesome!"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Close"], ["Close"]);

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

var _styles = require("../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Modal.Success");

var Success = (function(_React$Component) {
    (0, _inherits3.default)(Success, _React$Component);

    function Success() {
        (0, _classCallCheck3.default)(this, Success);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Success.__proto__ || Object.getPrototypeOf(Success)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Success, [
        {
            key: "renderFooter",
            value: function renderFooter() {
                var _this2 = this;

                var _props = this.props,
                    Button = _props.Button,
                    closeBtn = _props.closeBtn,
                    onClose = _props.onClose;

                var button = null;

                if ((0, _isFunction3.default)(closeBtn)) {
                    closeBtn = closeBtn(this);
                }

                if ((0, _isString3.default)(closeBtn)) {
                    button = _react2.default.createElement(Button, {
                        type: "primary",
                        label: closeBtn,
                        onClick: function onClick() {
                            return _this2.props.hide().then(onClose);
                        }
                    });
                }

                if (_react2.default.isValidElement(closeBtn)) {
                    button = closeBtn;
                }

                return _react2.default.createElement(_Footer2.default, null, button);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var content = this.props.message || this.props.children;

                if ((0, _isFunction3.default)(content)) {
                    content = content(this);
                }

                var _props2 = this.props,
                    Icon = _props2.Icon,
                    onShown = _props2.onShown;

                return _react2.default.createElement(
                    _Dialog2.default,
                    {
                        modalContainerTag: "success-modal",
                        className: _styles2.default.alertModal,
                        onShown: onShown
                    },
                    _react2.default.createElement(
                        _Content2.default,
                        null,
                        _react2.default.createElement(
                            _Body2.default,
                            null,
                            _react2.default.createElement(
                                "div",
                                { className: "text-center" },
                                _react2.default.createElement(Icon, {
                                    type: "success",
                                    size: "4x",
                                    icon: "icon-check-circle",
                                    element: "div"
                                }),
                                _react2.default.createElement("h4", null, this.props.title),
                                _react2.default.createElement("div", null, content)
                            )
                        ),
                        this.renderFooter()
                    )
                );
            }
        }
    ]);
    return Success;
})(_react2.default.Component);

Success.defaultProps = {
    title: t(_templateObject),
    closeBtn: t(_templateObject2),
    onClose: _noop3.default,
    onShown: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)([Success, _webinyAppUi.ModalComponent], {
    modules: ["Button", "Icon"]
});
//# sourceMappingURL=Success.js.map
