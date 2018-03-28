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

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var FormFilters = (function(_React$Component) {
    (0, _inherits3.default)(FormFilters, _React$Component);

    function FormFilters(props) {
        (0, _classCallCheck3.default)(this, FormFilters);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (FormFilters.__proto__ || Object.getPrototypeOf(FormFilters)).call(this, props)
        );

        ["submit", "applyFilters"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(FormFilters, [
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps) {
                return !(0, _isEqual3.default)(nextProps, this.props);
            }
        },
        {
            key: "applyFilters",
            value: function applyFilters(filters) {
                this.props.onFilter(filters);
            }
        },
        {
            key: "submit",
            value: function submit(_ref) {
                var model = _ref.model,
                    form = _ref.form;

                if (typeof this.props.onSubmit === "function") {
                    this.props.onSubmit({ model: model, form: form, apply: this.applyFilters });
                } else {
                    this.applyFilters(model);
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var Form = this.props.Form;

                return _react2.default.createElement(
                    Form,
                    {
                        defaultModel: this.props.defaultModel,
                        model: this.props.filters,
                        onSubmit: this.submit
                    },
                    function(_ref2) {
                        var form = _ref2.form;
                        return _this2.props.children({
                            apply: function apply() {
                                return function() {
                                    return form.submit();
                                };
                            },
                            reset: function reset() {
                                return function() {
                                    return _this2.applyFilters({});
                                };
                            }
                        });
                    }
                );
            }
        }
    ]);
    return FormFilters;
})(_react2.default.Component);

FormFilters.defaultProps = {
    defaultModel: null,
    onSubmit: function onSubmit(_ref3) {
        var model = _ref3.model,
            form = _ref3.form,
            apply = _ref3.apply;

        apply(model);
    }
};

exports.default = (0, _webinyApp.createComponent)(FormFilters, { modules: ["Form"] });
//# sourceMappingURL=FormFilters.js.map
