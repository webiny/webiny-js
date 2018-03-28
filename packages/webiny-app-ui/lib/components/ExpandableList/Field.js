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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Field = (function(_React$Component) {
    (0, _inherits3.default)(Field, _React$Component);

    function Field() {
        (0, _classCallCheck3.default)(this, Field);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Field.__proto__ || Object.getPrototypeOf(Field)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Field, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var className = (0, _classnames2.default)(
                    this.props.className,
                    "expandable-list__row__fields__field flex-cell flex-width-" + this.props.width
                );
                var content = this.props.children;
                if ((0, _isFunction3.default)(content)) {
                    content = content.call(this, { data: this.props.data, $this: this });
                }
                return _react2.default.createElement(
                    "div",
                    { className: className, onClick: this.props.onClick },
                    content
                );
            }
        }
    ]);
    return Field;
})(_react2.default.Component);

Field.defaultProps = {
    className: null,
    onClick: _noop3.default,
    width: null
};

exports.default = (0, _webinyApp.createComponent)(Field);
//# sourceMappingURL=Field.js.map
