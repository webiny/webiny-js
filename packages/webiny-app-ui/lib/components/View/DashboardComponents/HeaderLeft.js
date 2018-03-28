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

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var HeaderLeft = (function(_React$Component) {
    (0, _inherits3.default)(HeaderLeft, _React$Component);

    function HeaderLeft() {
        (0, _classCallCheck3.default)(this, HeaderLeft);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (HeaderLeft.__proto__ || Object.getPrototypeOf(HeaderLeft)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(HeaderLeft, [
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
                        className: (0, _classnames2.default)(
                            styles.dashboardHeaderLeft,
                            styles.titleWrapper
                        )
                    },
                    _react2.default.createElement(
                        "h2",
                        { className: styles.titleContent },
                        this.props.title
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: styles.titleDescription },
                        this.props.description
                    )
                );
            }
        }
    ]);
    return HeaderLeft;
})(_react2.default.Component);

HeaderLeft.defaultProps = {
    title: null,
    description: null
};

exports.default = (0, _webinyApp.createComponent)(HeaderLeft, { styles: _styles2.default });
//# sourceMappingURL=HeaderLeft.js.map
