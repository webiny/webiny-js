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
        ["Welcome to Webiny!"],
        ["Welcome to Webiny!"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["This is a demo dashboard! From here you can start developing your almighty app."],
        ["This is a demo dashboard! From here you can start developing your almighty app."]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.Layout.Dashboard");

var Dashboard = (function(_React$Component) {
    (0, _inherits3.default)(Dashboard, _React$Component);

    function Dashboard() {
        (0, _classCallCheck3.default)(this, Dashboard);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Dashboard.__proto__ || Object.getPrototypeOf(Dashboard)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Dashboard, [
        {
            key: "render",
            value: function render() {
                var View = this.props.View;

                return _react2.default.createElement(
                    View.Dashboard,
                    null,
                    _react2.default.createElement(View.Header, {
                        title: t(_templateObject),
                        description: t(_templateObject2)
                    })
                );
            }
        }
    ]);
    return Dashboard;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Dashboard);
//# sourceMappingURL=Dashboard.js.map
