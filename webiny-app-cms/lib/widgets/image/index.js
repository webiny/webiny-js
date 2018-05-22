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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Widget2 = require("../../utils/Widget");

var _Widget3 = _interopRequireDefault(_Widget2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImageWidget = (function(_Widget) {
    (0, _inherits3.default)(ImageWidget, _Widget);

    function ImageWidget() {
        (0, _classCallCheck3.default)(this, ImageWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImageWidget.__proto__ || Object.getPrototypeOf(ImageWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ImageWidget, [
        {
            key: "render",
            value: function render(widget) {
                var src = (0, _get3.default)(widget, "data.image.src");

                if (!src) {
                    return null;
                }

                var caption = (0, _get3.default)(widget, "data.caption");

                return _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement("img", { style: { width: "100%" }, src: src }),
                    caption &&
                        _react2.default.createElement(
                            "h5",
                            { style: { color: "#666", textAlign: "center" } },
                            '"',
                            caption,
                            '"'
                        )
                );
            }
        }
    ]);
    return ImageWidget;
})(_Widget3.default);

exports.default = ImageWidget;
//# sourceMappingURL=index.js.map
