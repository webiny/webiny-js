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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ChartBlock = (function(_React$Component) {
    (0, _inherits3.default)(ChartBlock, _React$Component);

    function ChartBlock() {
        (0, _classCallCheck3.default)(this, ChartBlock);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ChartBlock.__proto__ || Object.getPrototypeOf(ChartBlock)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ChartBlock, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }
                var styles = this.props.styles;

                return _react2.default.createElement(
                    "div",
                    {
                        className: (0, _classnames2.default)(styles.infoBlock, this.props.className)
                    },
                    _react2.default.createElement(
                        "div",
                        { className: styles.header },
                        _react2.default.createElement(
                            "h4",
                            { className: styles.title },
                            this.props.title
                        ),
                        _react2.default.createElement(
                            "div",
                            { className: styles.titleLight },
                            this.props.description
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: styles.container },
                        this.props.children
                    )
                );
            }
        }
    ]);
    return ChartBlock;
})(_react2.default.Component);

ChartBlock.defaultProps = {
    title: "",
    description: "",
    className: ""
};

exports.default = (0, _webinyApp.createComponent)(ChartBlock, { styles: _styles2.default });
//# sourceMappingURL=ChartBlock.js.map
