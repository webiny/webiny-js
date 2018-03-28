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

var RowDetailsList = (function(_React$Component) {
    (0, _inherits3.default)(RowDetailsList, _React$Component);

    function RowDetailsList() {
        (0, _classCallCheck3.default)(this, RowDetailsList);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (RowDetailsList.__proto__ || Object.getPrototypeOf(RowDetailsList)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(RowDetailsList, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var content = this.props.children;
                if (typeof this.props.children === "function") {
                    content = this.props.children.call(this, {
                        data: this.props.data,
                        $this: this
                    });
                }

                return _react2.default.createElement("div", null, content);
            }
        }
    ]);
    return RowDetailsList;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(RowDetailsList);
//# sourceMappingURL=RowDetailsList.js.map
