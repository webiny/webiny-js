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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ModalMultiAction = (function(_React$Component) {
    (0, _inherits3.default)(ModalMultiAction, _React$Component);

    function ModalMultiAction(props) {
        (0, _classCallCheck3.default)(this, ModalMultiAction);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ModalMultiAction.__proto__ || Object.getPrototypeOf(ModalMultiAction)).call(
                this,
                props
            )
        );

        _this.state = {
            modal: null
        };
        return _this;
    }

    (0, _createClass3.default)(ModalMultiAction, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (
                    (0, _isFunction3.default)(this.props.hide) &&
                    this.props.hide(this.props.data)
                ) {
                    return null;
                }

                var onAction = function onAction() {
                    if (_this2.props.data.length) {
                        var modal = _this2.props.children.call(_this2, {
                            data: _this2.props.data,
                            actions: _this2.props.actions,
                            dialog: {
                                hide: function hide() {
                                    if (_this2.dialog) {
                                        return _this2.dialog.hide();
                                    }
                                    return Promise.resolve(true);
                                }
                            }
                        });
                        _this2.setState({ modal: modal });
                    }
                };

                var Link = this.props.Link;

                var dialogProps = {
                    onReady: function onReady(dialog) {
                        _this2.dialog = dialog;
                        dialog.show();
                    },
                    // `dialog` is passed from Component.js as `this` of the mounted dialog itself
                    onHidden: function onHidden() {
                        _this2.dialog = null;
                        _this2.setState({ modal: null });
                    }
                };

                return _react2.default.createElement(
                    Link,
                    { onClick: onAction },
                    this.state.modal
                        ? _react2.default.cloneElement(this.state.modal, dialogProps)
                        : null,
                    this.props.label
                );
            }
        }
    ]);
    return ModalMultiAction;
})(_react2.default.Component);

ModalMultiAction.defaultProps = {
    actions: null,
    label: null,
    data: null,
    hide: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(ModalMultiAction, { modules: ["Link"] });
//# sourceMappingURL=ModalMultiAction.js.map
