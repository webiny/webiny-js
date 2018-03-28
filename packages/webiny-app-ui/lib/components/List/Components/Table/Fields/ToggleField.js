"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _set2 = require("lodash/set");

var _set3 = _interopRequireDefault(_set2);

var _isNull2 = require("lodash/isNull");

var _isNull3 = _interopRequireDefault(_isNull2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ToggleField = (function(_React$Component) {
    (0, _inherits3.default)(ToggleField, _React$Component);

    function ToggleField() {
        (0, _classCallCheck3.default)(this, ToggleField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ToggleField.__proto__ || Object.getPrototypeOf(ToggleField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ToggleField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    ChangeConfirm = _props.ChangeConfirm,
                    Switch = _props.Switch,
                    List = _props.List,
                    render = _props.render,
                    tdProps = (0, _objectWithoutProperties3.default)(_props, [
                        "ChangeConfirm",
                        "Switch",
                        "List",
                        "render"
                    ]);

                if (render) {
                    return render.call(this);
                }

                var props = {
                    onChange: function onChange(newValue) {
                        if ((0, _isNull3.default)(_this2.props.onChange)) {
                            var attributes = {};
                            (0, _set3.default)(attributes, _this2.props.name, newValue);
                            _this2.props.actions.update(_this2.props.data.id, attributes);
                        } else {
                            _this2.props.onChange(newValue);
                        }
                    },
                    value: (0, _get3.default)(this.props.data, this.props.name),
                    disabled: (0, _isFunction3.default)(this.props.disabled)
                        ? this.props.disabled(this.props.data)
                        : this.props.disabled
                };

                return _react2.default.createElement(List.Table.Field, tdProps, function() {
                    return _react2.default.createElement(
                        ChangeConfirm,
                        { message: _this2.props.message },
                        _react2.default.createElement(Switch, props)
                    );
                });
            }
        }
    ]);
    return ToggleField;
})(_react2.default.Component);

ToggleField.defaultProps = {
    message: null,
    onChange: null,
    disabled: false
};

exports.default = (0, _webinyApp.createComponent)(ToggleField, {
    modules: ["List", "ChangeConfirm", "Switch"],
    tableField: true
});
//# sourceMappingURL=ToggleField.js.map
