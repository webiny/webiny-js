"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

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

var _omit3 = require("lodash/omit");

var _omit4 = _interopRequireDefault(_omit3);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["Visit http://fontawesome.io for full list"],
    ["Visit http://fontawesome.io for full list"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _icons = require("./icons");

var _icons2 = _interopRequireDefault(_icons);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.IconPicker");

var IconPicker = (function(_React$Component) {
    (0, _inherits3.default)(IconPicker, _React$Component);

    function IconPicker(props) {
        (0, _classCallCheck3.default)(this, IconPicker);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (IconPicker.__proto__ || Object.getPrototypeOf(IconPicker)).call(this, props)
        );

        ["renderOption", "renderSelected"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(IconPicker, [
        {
            key: "renderOption",
            value: function renderOption(_ref) {
                var option = _ref.option,
                    params = (0, _objectWithoutProperties3.default)(_ref, ["option"]);

                if (this.props.renderOption) {
                    return this.props.renderOption(Object.assign({ option: option }, params));
                }

                var Icon = this.props.Icon;

                return _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement(Icon, { icon: "fa " + option.id }),
                    " ",
                    option.text
                );
            }
        },
        {
            key: "renderSelected",
            value: function renderSelected(_ref2) {
                var option = _ref2.option,
                    params = (0, _objectWithoutProperties3.default)(_ref2, ["option"]);

                if (this.props.renderSelected) {
                    return this.props.renderSelected(Object.assign({ option: option }, params));
                }

                var Icon = this.props.Icon;

                return _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement(Icon, { icon: "fa " + option.id }),
                    " ",
                    option.text
                );
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _omit2 = (0, _omit4.default)(this.props, ["render"]),
                    Select = _omit2.Select,
                    props = (0, _objectWithoutProperties3.default)(_omit2, ["Select"]);

                props.renderOption = this.renderOption;
                props.renderSelected = this.renderSelected;

                return _react2.default.createElement(
                    Select,
                    (0, _extends3.default)({}, props, { options: _icons2.default })
                );
            }
        }
    ]);
    return IconPicker;
})(_react2.default.Component);

IconPicker.defaultProps = {
    minimumInputLength: 2,
    tooltip: t(_templateObject),
    renderOption: null,
    renderSelected: null
};

exports.default = (0, _webinyApp.createComponent)(IconPicker, {
    modules: ["Select", "Icon"],
    formComponent: true
});
//# sourceMappingURL=index.js.map
