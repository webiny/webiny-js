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

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ErrorCount = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ErrorCount, _Webiny$Ui$View);

    function ErrorCount(props) {
        (0, _classCallCheck3.default)(this, ErrorCount);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ErrorCount.__proto__ || Object.getPrototypeOf(ErrorCount)).call(this, props)
        );

        _this.state = {
            errorCount: _this.props.count
        };

        _this.bindMethods("updateCount");
        return _this;
    }

    (0, _createClass3.default)(ErrorCount, [
        {
            key: "updateCount",
            value: function updateCount(count) {
                this.setState({ errorCount: count });
            }
        }
    ]);
    return ErrorCount;
})(_webinyClient.Webiny.Ui.View);

ErrorCount.defaultProps = {
    renderer: function renderer() {
        return _react2.default.createElement(
            "span",
            { className: "badge badge-primary" },
            this.state.errorCount
        );
    }
};

exports.default = ErrorCount;
//# sourceMappingURL=ErrorCount.js.map
