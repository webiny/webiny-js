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

var ApplyWidgetChanges = (function(_React$Component) {
    (0, _inherits3.default)(ApplyWidgetChanges, _React$Component);

    function ApplyWidgetChanges(_ref) {
        var services = _ref.services;
        (0, _classCallCheck3.default)(this, ApplyWidgetChanges);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ApplyWidgetChanges.__proto__ || Object.getPrototypeOf(ApplyWidgetChanges)).call(this)
        );

        _this.state = {
            showApplyChanges: false
        };

        _this.cms = services.cms;

        _this.onChange = _this.onChange.bind(_this);
        _this.applyChanges = _this.applyChanges.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ApplyWidgetChanges, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(_ref2) {
                var widget = _ref2.widget;

                if (widget.origin !== this.props.widget.origin || !widget.__dirty) {
                    this.setState({ showApplyChanges: false });
                }
            }
        },
        {
            key: "applyChanges",
            value: function applyChanges() {
                var _this2 = this;

                var _props$widget = this.props.widget,
                    data = _props$widget.data,
                    settings = _props$widget.settings;

                this.cms
                    .updateGlobalWidget(this.props.widget.origin, {
                        data: data,
                        settings: settings
                    })
                    .then(function() {
                        _this2.props.onChange({ data: null, settings: null, __dirty: false });
                    });
            }
        },
        {
            key: "render",
            value: function render() {
                return this.props.children({
                    widget: this.props.widget,
                    onChange: this.onChange,
                    applyChanges: this.state.showApplyChanges ? this.applyChanges : null
                });
            }
        }
    ]);
    return ApplyWidgetChanges;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ApplyWidgetChanges, { services: ["cms"] });
//# sourceMappingURL=ApplyWidgetChanges.js.map
