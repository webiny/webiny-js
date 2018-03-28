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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TimeAgoField = (function(_React$Component) {
    (0, _inherits3.default)(TimeAgoField, _React$Component);

    function TimeAgoField() {
        (0, _classCallCheck3.default)(this, TimeAgoField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TimeAgoField.__proto__ || Object.getPrototypeOf(TimeAgoField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TimeAgoField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    List = _props.List,
                    moment = _props.moment,
                    data = _props.data,
                    name = _props.name,
                    render = _props.render,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "List",
                        "moment",
                        "data",
                        "name",
                        "render"
                    ]);

                if (render) {
                    return render.call(this);
                }

                var value = data[name];
                if (value) {
                    value = moment(value).fromNow();
                }

                return _react2.default.createElement(List.Table.Field, props, function() {
                    return value || _this2.props.default;
                });
            }
        }
    ]);
    return TimeAgoField;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(TimeAgoField, {
    modules: ["List", { moment: "Vendor.Moment" }],
    tableField: true
});
//# sourceMappingURL=TimeAgoField.js.map
