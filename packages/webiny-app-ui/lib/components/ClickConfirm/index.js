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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _now2 = require("lodash/now");

var _now3 = _interopRequireDefault(_now2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["We need you to confirm your action."],
    ["We need you to confirm your action."]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * If onClick function we are handling returns a function, the confirmation dialog will be hidden before executing the function.
 * This will prevent unwanted unmounts and execution of code on unmounted components.
 */

var t = _webinyApp.i18n.namespace("Webiny.Ui.ClickConfirm");

var ClickConfirm = (function(_React$Component) {
    (0, _inherits3.default)(ClickConfirm, _React$Component);

    function ClickConfirm(props) {
        (0, _classCallCheck3.default)(this, ClickConfirm);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ClickConfirm.__proto__ || Object.getPrototypeOf(ClickConfirm)).call(this, props)
        );

        _this.message = null;
        _this.realOnClick = _noop3.default;
        _this.dialogId = (0, _uniqueId3.default)("click-confirm-");

        _this.onClick = _this.onClick.bind(_this);
        _this.onConfirm = _this.onConfirm.bind(_this);
        _this.onCancel = _this.onCancel.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ClickConfirm, [
        {
            key: "onClick",
            value: function onClick() {
                var _this2 = this;

                var msg = this.props.message;
                if ((0, _isFunction3.default)(msg)) {
                    msg = msg();
                }

                if (!msg && !this.props.renderDialog) {
                    this.realOnClick();
                    return;
                }

                this.message = msg;
                this.setState({ time: (0, _now3.default)() }, function() {
                    _webinyApp.app.services.get("modal").show(_this2.dialogId);
                });
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
                return _webinyApp.app.services
                    .get("modal")
                    .hide(this.dialogId)
                    .then(this.props.onCancel);
            }

            /**
             * The `data` param can be used when creating a custom confirmation dialog (maybe even with a form).
             * When calling `confirm` callback - whatever data is passed to it will be passed down to original `onClick` handler.
             * That way you can dynamically handle the different scenarios of the confirmation dialog.
             *
             * @returns {Promise.<*>}
             */
        },
        {
            key: "onConfirm",
            value: function onConfirm() {
                var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                return Promise.resolve(this.realOnClick(data, this));
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                // Input
                var input = this.getInput(this.props);
                this.realOnClick = input.props.onClick;
                var props = (0, _omit3.default)(input.props, ["onClick"]);
                props.onClick = this.onClick;

                var dialogProps = {
                    name: this.dialogId,
                    message: this.message,
                    onConfirm: this.onConfirm,
                    onCancel: this.onCancel,
                    onComplete: this.props.onComplete
                };

                var Modal = this.props.Modal;

                var dialog = (0, _isFunction3.default)(this.props.renderDialog)
                    ? this.props.renderDialog()
                    : _react2.default.createElement(Modal.Confirmation, null);

                return _react2.default.createElement(
                    "webiny-click-confirm",
                    null,
                    _react2.default.cloneElement(input, props),
                    _react2.default.cloneElement(dialog, dialogProps)
                );
            }
        }
    ]);
    return ClickConfirm;
})(_react2.default.Component);

ClickConfirm.defaultProps = {
    message: t(_templateObject),
    onComplete: _noop3.default,
    onCancel: _noop3.default,
    renderDialog: null
};

exports.default = (0, _webinyApp.createComponent)(ClickConfirm, { modules: ["Modal"] });
//# sourceMappingURL=index.js.map
