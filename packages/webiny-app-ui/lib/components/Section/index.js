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

var _size2 = require("lodash/size");

var _size3 = _interopRequireDefault(_size2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Section = (function(_React$Component) {
    (0, _inherits3.default)(Section, _React$Component);

    function Section() {
        (0, _classCallCheck3.default)(this, Section);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Section.__proto__ || Object.getPrototypeOf(Section)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Section, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Icon = _props.Icon,
                    styles = _props.styles,
                    title = _props.title,
                    children = _props.children;

                var icon = null;
                if (this.props.icon) {
                    icon = _react2.default.createElement(Icon, { icon: this.props.icon });
                }

                return _react2.default.createElement(
                    "div",
                    { className: styles.wrapper },
                    _react2.default.createElement(
                        "div",
                        { className: styles.header },
                        _react2.default.createElement(
                            "h5",
                            { className: styles.title },
                            icon,
                            " ",
                            title
                        ),
                        (0, _size3.default)(children) > 0 &&
                            _react2.default.createElement(
                                "div",
                                { className: styles.container },
                                children
                            )
                    )
                );
            }
        }
    ]);
    return Section;
})(_react2.default.Component);

Section.defaultProps = {
    title: null,
    icon: null
};

exports.default = (0, _webinyApp.createComponent)(Section, {
    modules: ["Icon"],
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
