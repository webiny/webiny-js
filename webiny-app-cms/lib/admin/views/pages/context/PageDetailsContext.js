"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PageDetailsConsumer = exports.PageDetailsProvider = undefined;

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

var _PageManagerContext = require("./PageManagerContext");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageDetailsContext = _react2.default.createContext();

var PageDetailsProvider = (exports.PageDetailsProvider = (function(_React$Component) {
    (0, _inherits3.default)(PageDetailsProvider, _React$Component);

    function PageDetailsProvider() {
        (0, _classCallCheck3.default)(this, PageDetailsProvider);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageDetailsProvider.__proto__ || Object.getPrototypeOf(PageDetailsProvider)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(PageDetailsProvider, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                return _react2.default.createElement(
                    _PageManagerContext.PageManagerConsumer,
                    null,
                    function(value) {
                        return _react2.default.createElement(
                            PageDetailsContext.Provider,
                            { value: Object.assign({}, value, _this2.props.value) },
                            _this2.props.children
                        );
                    }
                );
            }
        }
    ]);
    return PageDetailsProvider;
})(_react2.default.Component));

var PageDetailsConsumer = (exports.PageDetailsConsumer = (function(_React$Component2) {
    (0, _inherits3.default)(PageDetailsConsumer, _React$Component2);

    function PageDetailsConsumer() {
        (0, _classCallCheck3.default)(this, PageDetailsConsumer);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageDetailsConsumer.__proto__ || Object.getPrototypeOf(PageDetailsConsumer)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(PageDetailsConsumer, [
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    PageDetailsContext.Consumer,
                    null,
                    this.props.children
                );
            }
        }
    ]);
    return PageDetailsConsumer;
})(_react2.default.Component));
//# sourceMappingURL=PageDetailsContext.js.map
