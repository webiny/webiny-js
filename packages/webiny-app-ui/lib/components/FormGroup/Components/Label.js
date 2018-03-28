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

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Label = (function(_React$Component) {
    (0, _inherits3.default)(Label, _React$Component);

    function Label() {
        (0, _classCallCheck3.default)(this, Label);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Label.__proto__ || Object.getPrototypeOf(Label)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Label, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var tooltip = null;
                if (this.props.tooltip) {
                    tooltip = _react2.default.createElement(
                        _webinyApp.LazyLoad,
                        { modules: ["Tooltip", "Icon"] },
                        function(_ref) {
                            var Tooltip = _ref.Tooltip,
                                Icon = _ref.Icon;
                            return _react2.default.createElement(
                                Tooltip,
                                {
                                    key: "label",
                                    target: _react2.default.createElement(Icon, {
                                        icon: "icon-info-circle"
                                    })
                                },
                                _this2.props.tooltip
                            );
                        }
                    );
                }
                return _react2.default.createElement(
                    "label",
                    { className: _styles2.default.label },
                    this.props.children,
                    " ",
                    tooltip
                );
            }
        }
    ]);
    return Label;
})(_react2.default.Component);

Label.defaultProps = {
    tooltip: null
};

exports.default = (0, _webinyApp.createComponent)(Label);
//# sourceMappingURL=Label.js.map
