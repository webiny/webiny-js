"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var crudLabels = {
    "/.post": "C",
    "{id}.get": "R",
    "/.get": "R",
    "{id}.patch": "U",
    "{id}.delete": "D"
};

/**
 * @i18n.namespace Webiny.Backend.Acl.ToggleAccessButton
 */

var ToggleAccessButton = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(ToggleAccessButton, _Webiny$Ui$Component);

    function ToggleAccessButton() {
        (0, _classCallCheck3.default)(this, ToggleAccessButton);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ToggleAccessButton.__proto__ || Object.getPrototypeOf(ToggleAccessButton)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ToggleAccessButton, [
        {
            key: "renderLabel",
            value: function renderLabel() {
                if (this.props.label) {
                    return this.props.label;
                }

                var key = this.props.method.key;
                return crudLabels[key] || "E";
            }
        }
    ]);
    return ToggleAccessButton;
})(_webinyClient.Webiny.Ui.Component);

ToggleAccessButton.defaultProps = {
    label: null,
    method: null,
    value: false,
    onClick: _lodash2.default.noop,
    renderer: function renderer() {
        var _this2 = this;

        var _props = this.props,
            Button = _props.Button,
            method = _props.method,
            _onClick = _props.onClick,
            value = _props.value;

        return _react2.default.createElement(
            "div",
            {
                className: _styles2.default.toggleAccessButtonWrapper,
                ref: function ref(_ref) {
                    return (_this2.ref = _ref);
                }
            },
            method.public
                ? _react2.default.createElement(
                      Button,
                      {
                          type: "primary",
                          className: this.classSet(
                              _styles2.default.toggleAccessButton,
                              _styles2.default.toggleAccessButtonPublic
                          )
                      },
                      this.i18n("P")
                  )
                : _react2.default.createElement(
                      Button,
                      {
                          type: "primary",
                          onClick: function onClick() {
                              _this2.ref.querySelector("button").blur();
                              _onClick();
                          },
                          className: this.classSet(
                              _styles2.default.toggleAccessButton,
                              (0, _defineProperty3.default)(
                                  {},
                                  _styles2.default.toggleAccessButtonExposed,
                                  value
                              )
                          )
                      },
                      this.renderLabel()
                  )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(ToggleAccessButton, {
    modules: ["Button"]
});
//# sourceMappingURL=ToggleAccessButton.js.map
