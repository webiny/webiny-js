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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ModalConfirmationComponent = (function(_React$Component) {
    (0, _inherits3.default)(ModalConfirmationComponent, _React$Component);

    function ModalConfirmationComponent(props) {
        (0, _classCallCheck3.default)(this, ModalConfirmationComponent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (
                ModalConfirmationComponent.__proto__ ||
                Object.getPrototypeOf(ModalConfirmationComponent)
            ).call(this, props)
        );

        _this.state = {
            loading: false
        };

        _this.onCancel = _this.onCancel.bind(_this);
        _this.onConfirm = _this.onConfirm.bind(_this);
        _this.showLoading = _this.showLoading.bind(_this);
        _this.hideLoading = _this.hideLoading.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ModalConfirmationComponent, [
        {
            key: "showLoading",
            value: function showLoading() {
                this.setState({ loading: true });
            }
        },
        {
            key: "hideLoading",
            value: function hideLoading() {
                this.setState({ loading: false });
            }
        },
        {
            key: "onCancel",
            value: function onCancel() {
                if (!this.props.animating) {
                    if ((0, _isFunction3.default)(this.props.onCancel)) {
                        return this.props.onCancel(this);
                    }
                    return this.props.hide();
                }
            }

            /**
             * This function is executed when dialog is confirmed, it handles all the maintenance stuff and executes `onConfirm` callback
             * passed through props and also passes optional `data` object to that callback.
             *
             * It can receive a `data` object containing arbitrary data from your custom form, for example.
             *
             * If no `data` is passed - ModalConfirmationComponent dialog will check if `data` prop is defined and use that as data payload for `onConfirm`
             * callbacks.
             *
             * @param data
             * @returns {Promise.<TResult>}
             */
        },
        {
            key: "onConfirm",
            value: function onConfirm() {
                var _this2 = this;

                var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                if (!this.props.animating && (0, _isFunction3.default)(this.props.onConfirm)) {
                    this.showLoading();
                    data = (0, _isPlainObject3.default)(data) ? data : this.props.data;
                    return Promise.resolve(this.props.onConfirm({ data: data, dialog: this })).then(
                        function(result) {
                            _this2.hideLoading();
                            if (_this2.props.autoHide) {
                                return _this2.props.hide().then(function() {
                                    // If the result of confirmation is a function, it means we need to hide the dialog before executing it.
                                    // This is often necessary if the function will set a new state in the view - it will re-render itself and the modal
                                    // animation will be aborted (most common case is delete confirmation).
                                    if ((0, _isFunction3.default)(result)) {
                                        // The result of the function will be passed to `onComplete` and not the function itself
                                        result = result();
                                    }
                                    _this2.props.onComplete({ data: result });
                                });
                            }
                        }
                    );
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    children = _props.children,
                    props = (0, _objectWithoutProperties3.default)(_props, ["children"]);

                return _react2.default.cloneElement(
                    children,
                    Object.assign({}, props, {
                        loading: this.state.loading,
                        onConfirm: this.onConfirm,
                        onCancel: this.onCancel
                    })
                );
            }
        }
    ]);
    return ModalConfirmationComponent;
})(_react2.default.Component);

ModalConfirmationComponent.defaultProps = {
    onConfirm: _noop3.default,
    onComplete: _noop3.default,
    onCancel: null,
    autoHide: true,
    data: null
};

exports.default = (0, _webinyApp.createComponent)([
    ModalConfirmationComponent,
    _webinyAppUi.ModalComponent
]);
//# sourceMappingURL=ModalConfirmationComponent.js.map
