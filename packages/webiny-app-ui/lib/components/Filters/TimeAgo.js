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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TimeAgo = (function(_React$Component) {
    (0, _inherits3.default)(TimeAgo, _React$Component);

    function TimeAgo() {
        (0, _classCallCheck3.default)(this, TimeAgo);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TimeAgo.__proto__ || Object.getPrototypeOf(TimeAgo)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TimeAgo, [
        {
            key: "render",
            value: function render() {
                var moment = this.props.moment;

                var timeAgo = moment(this.props.value, moment.ISO_8601);

                return _react2.default.createElement(
                    "span",
                    null,
                    timeAgo.isValid() ? timeAgo.fromNow() : this.props.invalidMessage
                );
            }
        }
    ]);
    return TimeAgo;
})(_react2.default.Component);

TimeAgo.defaultProps = {
    value: null,
    invalidMessage: "invalid date format"
};

exports.default = (0, _webinyApp.createComponent)(TimeAgo, {
    modules: [{ moment: "Webiny/Vendors/Moment" }]
});
//# sourceMappingURL=TimeAgo.js.map
