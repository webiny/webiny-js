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

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _LayoutSelector = require("./LayoutSelector.scss?prefix=Webiny_CMS_Row_Selector");

var _LayoutSelector2 = _interopRequireDefault(_LayoutSelector);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LayoutSelector = (function(_React$Component) {
    (0, _inherits3.default)(LayoutSelector, _React$Component);

    function LayoutSelector(_ref) {
        var services = _ref.services;
        (0, _classCallCheck3.default)(this, LayoutSelector);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (LayoutSelector.__proto__ || Object.getPrototypeOf(LayoutSelector)).call(this)
        );

        _this.state = {
            showWidgets: false
        };

        _this.selectWidget = _this.selectWidget.bind(_this);
        _this.layoutWidgets = services.cms.getLayoutEditorWidgets();
        return _this;
    }

    (0, _createClass3.default)(LayoutSelector, [
        {
            key: "selectWidget",
            value: function selectWidget(widget) {
                var _this2 = this;

                this.setState({ showWidgets: false }, function() {
                    _this2.props.onSelect(
                        (0, _pick3.default)(widget, ["origin", "type", "data", "settings"]),
                        _this2.props.position
                    );
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props$modules = this.props.modules,
                    Button = _props$modules.Button,
                    Link = _props$modules.Link,
                    Icon = _props$modules.Icon;

                return _react2.default.createElement(
                    "div",
                    { className: _LayoutSelector2.default.layoutSelector },
                    !this.state.showWidgets &&
                        _react2.default.createElement(
                            Button,
                            {
                                icon: "plus-circle",
                                onClick: function onClick() {
                                    return _this3.setState({ showWidgets: true });
                                }
                            },
                            "Insert row"
                        ),
                    this.state.showWidgets &&
                        _react2.default.createElement(
                            "div",
                            { className: _LayoutSelector2.default.widgets },
                            _react2.default.createElement("h2", null, "CHOOSE ROW LAYOUT."),
                            _react2.default.createElement(
                                "h3",
                                null,
                                "Don't worry, you can edit layout type anytime you want."
                            ),
                            _react2.default.createElement("div", { className: "clear" }),
                            _react2.default.createElement(
                                Link,
                                {
                                    className: _LayoutSelector2.default.close,
                                    onClick: function onClick() {
                                        return _this3.setState({ showWidgets: false });
                                    }
                                },
                                "Cancel ",
                                _react2.default.createElement(Icon, { icon: "times" })
                            ),
                            _react2.default.createElement(
                                "ul",
                                { className: _LayoutSelector2.default.layoutRowList },
                                this.layoutWidgets.map(function(w, i) {
                                    return _react2.default.createElement(
                                        "li",
                                        {
                                            key: i,
                                            onClick: function onClick() {
                                                return _this3.selectWidget(w);
                                            },
                                            className: _LayoutSelector2.default.layoutRowSelector
                                        },
                                        w.widget.renderSelector()
                                    );
                                })
                            )
                        )
                );
            }
        }
    ]);
    return LayoutSelector;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(LayoutSelector, {
    services: ["cms"],
    modules: ["Button", "Link", "Icon"]
});
//# sourceMappingURL=LayoutSelector.js.map
