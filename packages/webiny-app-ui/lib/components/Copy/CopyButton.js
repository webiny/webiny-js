"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Copy.CopyButton");

var CopyButton = (function(_React$Component) {
    (0, _inherits3.default)(CopyButton, _React$Component);

    function CopyButton() {
        (0, _classCallCheck3.default)(this, CopyButton);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (CopyButton.__proto__ || Object.getPrototypeOf(CopyButton)).call(this)
        );

        _this.dom = null;
        return _this;
    }

    (0, _createClass3.default)(CopyButton, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                this.interval = setInterval(function() {
                    if (_this2.dom) {
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

                this.clipboard = new this.props.Clipboard(this.dom, {
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

                var props = (0, _omit3.default)(this.props, [
                    "renderer",
                    "onSuccessMessage",
                    "onCopy",
                    "value"
                ]);
                var Button = props.Button;

                return _react2.default.createElement(
                    Button,
                    (0, _extends3.default)(
                        {
                            onRef: function onRef(ref) {
                                return (_this4.dom = ref);
                            }
                        },
                        props
                    )
                );
            }
        }
    ]);
    return CopyButton;
})(_react2.default.Component);

CopyButton.defaultProps = {
    label: t(_templateObject),
    onSuccessMessage: t(_templateObject2),
    onCopy: _noop3.default,
    style: null,
    value: null
};

exports.default = (0, _webinyApp.createComponent)(CopyButton, {
    modules: [
        "Button",
        {
            Clipboard: function Clipboard() {
                return import("clipboard");
            }
        }
    ]
});
//# sourceMappingURL=CopyButton.js.map
