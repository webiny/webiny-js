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

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Access Forbidden"],
        ["Access Forbidden"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Unfortunately, you are not allowed to see this page."],
        ["Unfortunately, you are not allowed to see this page."]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["If you think this is a mistake, please contact your system administrator."],
        ["If you think this is a mistake, please contact your system administrator."]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.Auth.Forbidden");

var Forbidden = (function(_React$Component) {
    (0, _inherits3.default)(Forbidden, _React$Component);

    function Forbidden() {
        (0, _classCallCheck3.default)(this, Forbidden);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Forbidden.__proto__ || Object.getPrototypeOf(Forbidden)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Forbidden, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Icon = _props.Icon,
                    View = _props.View;

                return _react2.default.createElement(
                    View.List,
                    null,
                    _react2.default.createElement(
                        View.Body,
                        null,
                        _react2.default.createElement(
                            "h3",
                            null,
                            _react2.default.createElement(Icon, { icon: "icon-cancel" }),
                            t(_templateObject)
                        ),
                        _react2.default.createElement(
                            "p",
                            null,
                            t(_templateObject2),
                            _react2.default.createElement("br", null),
                            t(_templateObject3)
                        )
                    )
                );
            }
        }
    ]);
    return Forbidden;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Forbidden, { modules: ["Icon", "View"] });
//# sourceMappingURL=Forbidden.js.map
