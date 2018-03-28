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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isUndefined2 = require("lodash/isUndefined");

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["Confirm value change?"],
    ["Confirm value change?"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.ChangeConfirm");

var ChangeConfirm = (function(_React$Component) {
    (0, _inherits3.default)(ChangeConfirm, _React$Component);

    function ChangeConfirm(props) {
        (0, _classCallCheck3.default)(this, ChangeConfirm);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ChangeConfirm.__proto__ || Object.getPrototypeOf(ChangeConfirm)).call(this, props)
        );

        var input = _this.getInput(props);
        _this.state = {
            value: input.props.value
        };

        _this.dialogId = (0, _uniqueId3.default)("change-confirm-");
        _this.message = null;

        _this.onChange = _this.onChange.bind(_this);
        _this.onConfirm = _this.onConfirm.bind(_this);
        _this.onCancel = _this.onCancel.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ChangeConfirm, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                var input = this.getInput(props);
                this.setState({ value: input.props.value });
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps) {
                return !(0, _isEqual3.default)(nextProps, this.props);
            }
        },
        {
            key: "onChange",
            value: function onChange(value) {
                var input = this.getInput(this.props);
                var component = null;
                if (input.props.form) {
                    component = input.props.form.getInput(input.props.name);
                }

                var msg = this.props.message;
                if ((0, _isFunction3.default)(msg)) {
                    msg = msg({ value: value, component: component });
                }

                if (!msg) {
                    this.realOnChange(value);
                    return;
                }

                this.message = msg;
                this.value = value;
                _webinyApp.app.services.get("modal").show(this.dialogId);
            }
        },
        {
            key: "getInput",
            value: function getInput(props) {
                return _react2.default.Children.toArray(props.children)[0];
            }
        },
        {
            key: "onCancel",
            value: function onCancel() {
                var cancelValue = this.props.onCancel(this.getInput(this.props).props.form);
                if (!(0, _isUndefined3.default)(cancelValue)) {
                    this.realOnChange(cancelValue);
                }
                _webinyApp.app.services.get("modal").hide(this.dialogId);
            }
        },
        {
            key: "onConfirm",
            value: function onConfirm() {
                return this.realOnChange(this.value);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                // Input
                var input = this.getInput(this.props);
                this.realOnChange = input.props.onChange;
                var props = (0, _omit3.default)(input.props, ["onChange"]);
                props.onChange = this.onChange;

                var dialogProps = {
                    name: this.dialogId,
                    message: function message() {
                        return _this2.message;
                    },
                    onConfirm: this.onConfirm,
                    onCancel: this.onCancel,
                    onComplete: this.props.onComplete
                };

                var Modal = this.props.Modal;

                var dialog = (0, _isFunction3.default)(this.props.renderDialog)
                    ? this.props.renderDialog()
                    : _react2.default.createElement(Modal.Confirmation, null);

                return _react2.default.createElement(
                    "webiny-change-confirm",
                    null,
                    _react2.default.cloneElement(input, props),
                    _react2.default.cloneElement(dialog, dialogProps)
                );
            }
        }
    ]);
    return ChangeConfirm;
})(_react2.default.Component);

ChangeConfirm.defaultProps = {
    message: t(_templateObject),
    onComplete: _noop3.default,
    onCancel: _noop3.default,
    renderDialog: null
};

exports.default = (0, _webinyApp.createComponent)(ChangeConfirm, { modules: ["Modal"] });
//# sourceMappingURL=index.js.map
