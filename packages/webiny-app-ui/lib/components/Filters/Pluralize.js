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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Pluralize = (function(_React$Component) {
    (0, _inherits3.default)(Pluralize, _React$Component);

    function Pluralize() {
        (0, _classCallCheck3.default)(this, Pluralize);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Pluralize.__proto__ || Object.getPrototypeOf(Pluralize)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Pluralize, [
        {
            key: "render",
            value: function render() {
                var noun = this.props.noun;
                // If 'plural' is set, it will be used as plural form of given noun.
                if (this.props.plural && this.props.count !== 1) {
                    noun = this.props.plural;
                }

                if (!this.props.plural && this.props.count !== 1) {
                    noun = this.props.pluralize(this.props.noun, this.props.count);
                }

                var result = this.props.pattern
                    .replace("{count}", this.props.count)
                    .replace("{noun}", noun);

                return _react2.default.createElement("span", null, result);
            }
        }
    ]);
    return Pluralize;
})(_react2.default.Component);

Pluralize.defaultProps = {
    plural: null,
    count: null,
    noun: null,
    pattern: "{count} {noun}"
};

exports.default = (0, _webinyApp.createComponent)(Pluralize, {
    modules: [
        {
            pluralize: function pluralize() {
                return import("pluralize");
            }
        }
    ]
});
//# sourceMappingURL=Pluralize.js.map
