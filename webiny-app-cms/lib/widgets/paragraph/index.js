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

var _Widget2 = require("../../utils/Widget");

var _Widget3 = _interopRequireDefault(_Widget2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ParagraphWidget = (function(_Widget) {
    (0, _inherits3.default)(ParagraphWidget, _Widget);

    function ParagraphWidget() {
        (0, _classCallCheck3.default)(this, ParagraphWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ParagraphWidget.__proto__ || Object.getPrototypeOf(ParagraphWidget)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ParagraphWidget, [
        {
            key: "render",
            value: function render(widget) {
                var settings = widget.settings || {};
                return _react2.default.createElement(
                    "p",
                    { style: { textAlign: settings.align || "left" } },
                    widget.data.text
                );
            }
        }
    ]);
    return ParagraphWidget;
})(_Widget3.default);

exports.default = ParagraphWidget;
//# sourceMappingURL=index.js.map
