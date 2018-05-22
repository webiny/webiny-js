"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PageManagerConsumer = exports.PageManagerProvider = undefined;

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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageManagerContext = _react2.default.createContext();

var PageManagerProvider = (exports.PageManagerProvider = (function(_React$Component) {
    (0, _inherits3.default)(PageManagerProvider, _React$Component);

    function PageManagerProvider() {
        (0, _classCallCheck3.default)(this, PageManagerProvider);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageManagerProvider.__proto__ || Object.getPrototypeOf(PageManagerProvider)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(PageManagerProvider, [
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    PageManagerContext.Provider,
                    { value: this.props.value },
                    this.props.children
                );
            }
        }
    ]);
    return PageManagerProvider;
})(_react2.default.Component));

var PageManagerConsumer = (exports.PageManagerConsumer = (function(_React$Component2) {
    (0, _inherits3.default)(PageManagerConsumer, _React$Component2);

    function PageManagerConsumer() {
        (0, _classCallCheck3.default)(this, PageManagerConsumer);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageManagerConsumer.__proto__ || Object.getPrototypeOf(PageManagerConsumer)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(PageManagerConsumer, [
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    PageManagerContext.Consumer,
                    null,
                    this.props.children
                );
            }
        }
    ]);
    return PageManagerConsumer;
})(_react2.default.Component));
//# sourceMappingURL=PageManagerContext.js.map
