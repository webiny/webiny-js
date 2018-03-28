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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Copy"], ["Copy"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Copied to clipboard!"],
        ["Copied to clipboard!"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Copy.CopyInput");

var CopyInput = (function(_React$Component) {
    (0, _inherits3.default)(CopyInput, _React$Component);

    function CopyInput() {
        (0, _classCallCheck3.default)(this, CopyInput);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (CopyInput.__proto__ || Object.getPrototypeOf(CopyInput)).call(this)
        );

        _this.button = null;
        return _this;
    }

    (0, _createClass3.default)(CopyInput, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                this.interval = setInterval(function() {
                    if (_this2.button) {
                        clearInterval(_this2.interval);
                        _this2.interval = null;
                        _this2.setup();
                    }
                }, 100);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.clipboard.destroy();
            }
        },
        {
            key: "setup",
            value: function setup() {
                var _this3 = this;

                this.clipboard = new this.props.Clipboard(this.button, {
                    text: function text() {
                        return _this3.props.value;
                    }
                });

                this.clipboard.on("success", function() {
                    var onSuccessMessage = _this3.props.onSuccessMessage;
                    if ((0, _isFunction3.default)(onSuccessMessage)) {
                        onSuccessMessage();
                    } else if ((0, _isString3.default)(onSuccessMessage)) {
                        _webinyApp.app.services.get("growler").info(onSuccessMessage);
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Button = _props.Button,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var props = {
                    readOnly: true,
                    type: "text",
                    className: styles.input,
                    value: this.props.value || ""
                };

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    this.props.renderInfo.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: "inputGroup" },
                        _react2.default.createElement("input", props),
                        _react2.default.createElement(
                            Button,
                            {
                                onRef: function onRef(ref) {
                                    return (_this4.button = ref);
                                },
                                type: "primary",
                                className: styles.btnCopy
                            },
                            this.props.actionLabel
                        )
                    ),
                    this.props.renderDescription.call(this)
                );
            }
        }
    ]);
    return CopyInput;
})(_react2.default.Component);

CopyInput.defaultProps = {
    actionLabel: t(_templateObject),
    onSuccessMessage: t(_templateObject2),
    onCopy: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)([CopyInput, _webinyAppUi.FormComponent], {
    styles: _styles2.default,
    modules: [
        "Button",
        "FormGroup",
        {
            Clipboard: function Clipboard() {
                return import("clipboard");
            }
        }
    ]
});
//# sourceMappingURL=CopyInput.js.map
