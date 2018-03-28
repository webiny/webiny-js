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

var Action = (function(_React$Component) {
    (0, _inherits3.default)(Action, _React$Component);

    function Action() {
        (0, _classCallCheck3.default)(this, Action);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Action.__proto__ || Object.getPrototypeOf(Action)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Action, [
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

                if ((0, _isFunction3.default)(this.props.children)) {
                    return this.props.children.call(this, {
                        data: this.props.data,
                        actions: this.props.actions,
                        $this: this
                    });
                }

                var _props = this.props,
                    Icon = _props.Icon,
                    Link = _props.Link,
                    DownloadLink = _props.DownloadLink;

                var icon = this.props.icon
                    ? _react2.default.createElement(Icon, { icon: this.props.icon })
                    : null;

                if (this.props.download) {
                    return _react2.default.createElement(
                        DownloadLink,
                        {
                            download: this.props.download,
                            params: this.props.data
                        },
                        icon,
                        " ",
                        this.props.label
                    );
                }

                return _react2.default.createElement(
                    Link,
                    {
                        data: this.props.data,
                        onClick: function onClick() {
                            return _this2.props.onClick.call(_this2, {
                                data: _this2.props.data,
                                actions: _this2.props.actions,
                                $this: _this2
                            });
                        }
                    },
                    icon,
                    this.props.label
                );
            }
        }
    ]);
    return Action;
})(_react2.default.Component);

Action.defaultProps = {
    icon: null,
    onClick: _noop3.default,
    download: null,
    actions: null,
    data: null,
    hide: false
};

exports.default = (0, _webinyApp.createComponent)(Action, {
    modules: ["Icon", "Link", "DownloadLink"]
});
//# sourceMappingURL=Action.js.map
