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

var Filters = (function(_React$Component) {
    (0, _inherits3.default)(Filters, _React$Component);

    function Filters() {
        (0, _classCallCheck3.default)(this, Filters);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Filters.__proto__ || Object.getPrototypeOf(Filters)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Filters, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var callbacks = {
                    apply: function apply(filters) {
                        return function() {
                            return _this2.props.onFilter(filters);
                        };
                    },
                    reset: function reset() {
                        return function() {
                            return _this2.props.onFilter({});
                        };
                    }
                };

                return _react2.default.createElement(
                    "webiny-list-filters",
                    null,
                    this.props.children.call(this, callbacks)
                );
            }
        }
    ]);
    return Filters;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Filters);
//# sourceMappingURL=Filters.js.map
