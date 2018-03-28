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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var InfoBlock = (function(_React$Component) {
    (0, _inherits3.default)(InfoBlock, _React$Component);

    function InfoBlock() {
        (0, _classCallCheck3.default)(this, InfoBlock);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (InfoBlock.__proto__ || Object.getPrototypeOf(InfoBlock)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(InfoBlock, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }
                var showHeader = false;
                if (this.props.title !== "" || this.props.description !== "") {
                    showHeader = true;
                }

                return _react2.default.createElement(
                    "div",
                    {
                        className: (0, _classnames2.default)(
                            _styles2.default.infoBlock,
                            this.props.className
                        )
                    },
                    showHeader &&
                        _react2.default.createElement(
                            "div",
                            { className: _styles2.default.header },
                            _react2.default.createElement(
                                "h4",
                                { className: _styles2.default.title },
                                this.props.title
                            ),
                            _react2.default.createElement(
                                "div",
                                { className: _styles2.default.titleLight },
                                this.props.description
                            )
                        ),
                    _react2.default.createElement(
                        "div",
                        { className: _styles2.default.container },
                        this.props.children
                    )
                );
            }
        }
    ]);
    return InfoBlock;
})(_react2.default.Component);

InfoBlock.defaultProps = {
    title: "",
    description: "",
    className: ""
};

exports.default = (0, _webinyApp.createComponent)(InfoBlock, { styles: _styles2.default });
//# sourceMappingURL=InfoBlock.js.map
