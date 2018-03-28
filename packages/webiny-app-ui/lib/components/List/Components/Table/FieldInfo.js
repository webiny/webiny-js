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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Close"], ["Close"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.Table.FieldInfo");

var FieldInfo = (function(_React$Component) {
    (0, _inherits3.default)(FieldInfo, _React$Component);

    function FieldInfo(props) {
        (0, _classCallCheck3.default)(this, FieldInfo);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (FieldInfo.__proto__ || Object.getPrototypeOf(FieldInfo)).call(this, props)
        );

        ["showInfo", "hideInfo"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(FieldInfo, [
        {
            key: "showInfo",
            value: function showInfo() {
                this.refs.dialog.show();
            }
        },
        {
            key: "hideInfo",
            value: function hideInfo() {
                this.refs.dialog.hide();
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var info = _react2.default.createElement(
                    "a",
                    { onClick: this.showInfo, href: "javascript:void(0);" },
                    _react2.default.createElement("span", { className: "icon icon-info" })
                );

                var _props = this.props,
                    Button = _props.Button,
                    Modal = _props.Modal;

                var modal = _react2.default.createElement(
                    Modal.Dialog,
                    { ref: "dialog" },
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, { title: this.props.title }),
                        _react2.default.createElement(Modal.Body, {
                            children: this.props.children
                        }),
                        _react2.default.createElement(
                            Modal.Footer,
                            null,
                            _react2.default.createElement(Button, {
                                label: t(_templateObject),
                                onClick: this.hideInfo
                            })
                        )
                    )
                );

                return _react2.default.createElement("webiny-field-info", null, info, modal);
            }
        }
    ]);
    return FieldInfo;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(FieldInfo, { modules: ["Modal", "Button"] });
//# sourceMappingURL=FieldInfo.js.map
