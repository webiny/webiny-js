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

var ModalAction = (function(_React$Component) {
    (0, _inherits3.default)(ModalAction, _React$Component);

    function ModalAction() {
        (0, _classCallCheck3.default)(this, ModalAction);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ModalAction.__proto__ || Object.getPrototypeOf(ModalAction)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ModalAction, [
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

                var _props = this.props,
                    Icon = _props.Icon,
                    Link = _props.Link,
                    Downloader = _props.Downloader;

                var download = function download(httpMethod, url) {
                    var params =
                        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

                    _this2.downloader.download(httpMethod, url, params);
                    _this2.dialog.hide();
                };

                var modal = this.props.children.call(this, {
                    data: this.props.data,
                    actions: this.props.actions,
                    download: download,
                    dialog: {
                        hide: function hide() {
                            if (_this2.dialog) {
                                return _this2.dialog.hide();
                            }
                            return Promise.resolve(true);
                        }
                    }
                });

                var icon = this.props.icon
                    ? _react2.default.createElement(Icon, { icon: this.props.icon })
                    : null;

                return _react2.default.createElement(
                    Link,
                    {
                        onClick: function onClick() {
                            return _this2.dialog.show();
                        }
                    },
                    icon,
                    this.props.label,
                    _react2.default.cloneElement(modal, {
                        onReady: function onReady(dialog) {
                            return (_this2.dialog = dialog);
                        }
                    }),
                    _react2.default.createElement(Downloader, {
                        ref: function ref(_ref) {
                            return (_this2.downloader = _ref);
                        }
                    })
                );
            }
        }
    ]);
    return ModalAction;
})(_react2.default.Component);

ModalAction.defaultProps = {
    data: null,
    actions: null,
    hide: _noop3.default,
    download: false
};

exports.default = (0, _webinyApp.createComponent)(ModalAction, {
    modules: ["Icon", "Link", "Downloader"]
});
//# sourceMappingURL=ModalAction.js.map
