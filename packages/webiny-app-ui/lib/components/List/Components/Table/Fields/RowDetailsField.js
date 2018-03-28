"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("../../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowDetailsField = (function(_React$Component) {
    (0, _inherits3.default)(RowDetailsField, _React$Component);

    function RowDetailsField() {
        (0, _classCallCheck3.default)(this, RowDetailsField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (RowDetailsField.__proto__ || Object.getPrototypeOf(RowDetailsField)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(RowDetailsField, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Link = _props.Link,
                    List = _props.List,
                    styles = _props.styles,
                    render = _props.render,
                    tdProps = (0, _objectWithoutProperties3.default)(_props, [
                        "Link",
                        "List",
                        "styles",
                        "render"
                    ]);

                if (render) {
                    return render.call(this);
                }

                var onClick = this.props.actions.hideRowDetails;
                var className = (0, _classnames2.default)(styles.expand, styles.close);
                if (!this.props.rowDetailsExpanded) {
                    onClick = this.props.actions.showRowDetails;
                    className = styles.expand;
                }

                var props = {
                    onClick: onClick(this.props.rowIndex),
                    className: className
                };

                var content = _react2.default.createElement(Link, props);
                if (
                    (0, _isFunction3.default)(this.props.hide)
                        ? this.props.hide(this.props.data)
                        : this.props.hide
                ) {
                    content = null;
                }

                return _react2.default.createElement(
                    List.Table.Field,
                    (0, _extends3.default)({}, tdProps, { className: styles.rowDetailsField }),
                    function() {
                        return content;
                    }
                );
            }
        }
    ]);
    return RowDetailsField;
})(_react2.default.Component);

RowDetailsField.defaultProps = {
    hide: false
};

exports.default = (0, _webinyApp.createComponent)(RowDetailsField, {
    modules: ["Link", "List"],
    tableField: true,
    styles: _styles2.default
});
//# sourceMappingURL=RowDetailsField.js.map
