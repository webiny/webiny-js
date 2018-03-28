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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _styles = require("../../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var SelectRowField = (function(_React$Component) {
    (0, _inherits3.default)(SelectRowField, _React$Component);

    function SelectRowField() {
        (0, _classCallCheck3.default)(this, SelectRowField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (SelectRowField.__proto__ || Object.getPrototypeOf(SelectRowField)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(SelectRowField, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    rowSelected = _props.rowSelected,
                    rowDisabled = _props.rowDisabled,
                    onSelect = _props.onSelect,
                    Checkbox = _props.Checkbox,
                    List = _props.List,
                    render = _props.render,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "rowSelected",
                        "rowDisabled",
                        "onSelect",
                        "Checkbox",
                        "List",
                        "render"
                    ]);

                if (render) {
                    return render.call(this);
                }

                return _react2.default.createElement(
                    List.Table.Field,
                    (0, _extends3.default)({}, props, { className: "row-details" }),
                    function() {
                        return _react2.default.createElement(Checkbox, {
                            disabled: rowDisabled,
                            value: rowSelected,
                            onChange: onSelect,
                            className: _styles2.default.selectRow
                        });
                    }
                );
            }
        }
    ]);
    return SelectRowField;
})(_react2.default.Component);

SelectRowField.defaultProps = {
    renderHeader: function renderHeader() {
        var _this2 = this;

        return _react2.default.createElement(
            "th",
            null,
            _react2.default.createElement(_webinyApp.LazyLoad, { modules: ["Checkbox"] }, function(
                _ref
            ) {
                var Checkbox = _ref.Checkbox;
                return _react2.default.createElement(Checkbox, {
                    value: _this2.props.allRowsSelected,
                    onChange: _this2.props.onSelectAll,
                    className: _styles2.default.selectRow
                });
            })
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(SelectRowField, {
    modules: ["Checkbox", "List"],
    styles: _styles2.default,
    tableField: true
});
//# sourceMappingURL=SelectRowField.js.map
