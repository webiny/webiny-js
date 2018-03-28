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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ClickSuccess = (function(_React$Component) {
    (0, _inherits3.default)(ClickSuccess, _React$Component);

    function ClickSuccess(props) {
        (0, _classCallCheck3.default)(this, ClickSuccess);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ClickSuccess.__proto__ || Object.getPrototypeOf(ClickSuccess)).call(this, props)
        );

        _this.state = { data: {} };
        _this.dialogId = (0, _uniqueId3.default)("click-success-");

        _this.getContent = _this.getContent.bind(_this);
        _this.onClick = _this.onClick.bind(_this);
        _this.hide = _this.hide.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ClickSuccess, [
        {
            key: "hide",
            value: function hide() {
                return _webinyApp.app.services.get("modal").hide(this.dialogId);
            }
        },
        {
            key: "onClick",
            value: function onClick() {
                var _this2 = this;

                return Promise.resolve(this.realOnClick(this)).then(function() {
                    return _webinyApp.app.services.get("modal").show(_this2.dialogId);
                });
            }
        },
        {
            key: "getContent",
            value: function getContent() {
                var _this3 = this;

                var content = this.props.children;
                if ((0, _isFunction3.default)(content)) {
                    return content({
                        success: function success(_ref) {
                            var data = _ref.data;

                            _this3.setState({ data: data }, function() {
                                _webinyApp.app.services.get("modal").show(_this3.dialogId);
                            });
                        }
                    });
                }

                var input = _react2.default.Children.toArray(content)[0];
                this.realOnClick = input.props.onClick;
                var props = (0, _omit3.default)(input.props, ["onClick"]);
                props.onClick = this.onClick;
                return _react2.default.cloneElement(input, props);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var dialogProps = {
                    name: this.dialogId,
                    message: function message() {
                        return (0, _isFunction3.default)(_this4.props.message)
                            ? _this4.props.message(_this4.state.data)
                            : _this4.props.message;
                    },
                    onClose: function onClose() {
                        _this4.hide().then(_this4.props.onClose);
                    }
                };

                if ((0, _isFunction3.default)(this.props.renderDialog)) {
                    // TODO: finish this part
                    dialogProps["render"] = this.props.renderDialog.bind(this, {
                        data: this.state.data,
                        close: dialogProps.onClose
                    });
                }

                var Modal = this.props.Modal;

                return _react2.default.createElement(
                    "webiny-click-success",
                    null,
                    this.getContent(),
                    _react2.default.createElement(Modal.Success, dialogProps)
                );
            }
        }
    ]);
    return ClickSuccess;
})(_react2.default.Component);

ClickSuccess.defaultProps = {
    onClose: _noop3.default,
    message: null,
    renderDialog: null
};

exports.default = (0, _webinyApp.createComponent)(ClickSuccess, { modules: ["Modal"] });
//# sourceMappingURL=index.js.map
