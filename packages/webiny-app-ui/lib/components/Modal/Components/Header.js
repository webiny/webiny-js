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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _size2 = require("lodash/size");

var _size3 = _interopRequireDefault(_size2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Header = (function(_React$Component) {
    (0, _inherits3.default)(Header, _React$Component);

    function Header() {
        (0, _classCallCheck3.default)(this, Header);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Header, [
        {
            key: "render",
            value: function render() {
                var headerContent = "";
                if ((0, _get3.default)(this.props, "title") && this.props.title !== "") {
                    headerContent = _react2.default.createElement("h4", null, this.props.title);
                } else if ((0, _size3.default)(this.props.children) > 0) {
                    headerContent = this.props.children;
                }

                return _react2.default.createElement(
                    "div",
                    {
                        className: (0, _classnames2.default)(
                            _styles2.default.header,
                            this.props.className
                        )
                    },
                    headerContent,
                    this.props.onClose &&
                        this.props.onClose !== _noop3.default &&
                        _react2.default.createElement(
                            "button",
                            {
                                onClick: this.props.onClose,
                                type: "button",
                                className: _styles2.default.close,
                                "data-dismiss": "modal"
                            },
                            "\xD7"
                        )
                );
            }
        }
    ]);
    return Header;
})(_react2.default.Component);

Header.defaultProps = {
    onClose: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(Header, { styles: _styles2.default });
//# sourceMappingURL=Header.js.map
