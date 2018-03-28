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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var MultiAction = (function(_React$Component) {
    (0, _inherits3.default)(MultiAction, _React$Component);

    function MultiAction(props) {
        (0, _classCallCheck3.default)(this, MultiAction);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (MultiAction.__proto__ || Object.getPrototypeOf(MultiAction)).call(this, props)
        );

        _this.onAction = _this.onAction.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(MultiAction, [
        {
            key: "onAction",
            value: function onAction() {
                this.props.onAction({ data: this.props.data, actions: this.props.actions });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Link = _props.Link,
                    DownloadLink = _props.DownloadLink;

                if (!this.props.data.length && !this.props.allowEmpty) {
                    return _react2.default.createElement(
                        Link,
                        { onClick: _noop3.default },
                        this.props.label
                    );
                }

                if (this.props.download) {
                    return _react2.default.createElement(
                        DownloadLink,
                        { download: this.props.download, params: this.props.data },
                        this.props.label
                    );
                }

                return _react2.default.createElement(
                    Link,
                    { onClick: this.onAction },
                    this.props.label
                );
            }
        }
    ]);
    return MultiAction;
})(_react2.default.Component);

MultiAction.defaultProps = {
    allowEmpty: false,
    onAction: _noop3.default,
    download: null,
    actions: null,
    data: []
};

exports.default = (0, _webinyApp.createComponent)(MultiAction, {
    modules: ["Link", "DownloadLink"]
});
//# sourceMappingURL=MultiAction.js.map
