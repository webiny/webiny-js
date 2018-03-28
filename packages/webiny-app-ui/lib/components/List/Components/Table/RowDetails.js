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

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowDetails = (function(_React$Component) {
    (0, _inherits3.default)(RowDetails, _React$Component);

    function RowDetails() {
        (0, _classCallCheck3.default)(this, RowDetails);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (RowDetails.__proto__ || Object.getPrototypeOf(RowDetails)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(RowDetails, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var css = (0, _classnames2.default)(
                    this.props.className,
                    _styles2.default.rowDetails
                );
                return _react2.default.createElement(
                    "tr",
                    {
                        className: css,
                        style: { display: this.props.expanded ? "table-row" : "none" }
                    },
                    _react2.default.createElement(
                        "td",
                        { colSpan: this.props.fieldsCount },
                        this.props.expanded
                            ? this.props.children({ data: this.props.data, $this: this })
                            : null
                    )
                );
            }
        }
    ]);
    return RowDetails;
})(_react2.default.Component);

RowDetails.defaultProps = {
    fieldsCount: 0,
    className: null
};

exports.default = (0, _webinyApp.createComponent)(RowDetails, { styles: _styles2.default });
//# sourceMappingURL=RowDetails.js.map
