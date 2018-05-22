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

var _webinyAppUi = require("webiny-app-ui");

var _WidgetsModal = require("./WidgetsModal.scss?");

var _WidgetsModal2 = _interopRequireDefault(_WidgetsModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WidgetsModal = (function(_React$Component) {
    (0, _inherits3.default)(WidgetsModal, _React$Component);

    function WidgetsModal() {
        (0, _classCallCheck3.default)(this, WidgetsModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetsModal.__proto__ || Object.getPrototypeOf(WidgetsModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(WidgetsModal, [
        {
            key: "renderWidget",
            value: function renderWidget(widget) {
                var _this2 = this;

                var icon = widget.icon,
                    title = widget.title,
                    origin = widget.origin,
                    type = widget.type,
                    data = widget.data,
                    settings = widget.settings;
                var _props = this.props,
                    Icon = _props.modules.Icon,
                    onSelect = _props.onSelect,
                    onDelete = _props.onDelete;

                return _react2.default.createElement(
                    "li",
                    { key: origin || type },
                    origin &&
                        _react2.default.createElement(
                            "a",
                            {
                                href: "#",
                                className: _WidgetsModal2.default.delete,
                                onClick: function onClick() {
                                    return _this2.props.hide().then(function() {
                                        return onDelete(widget);
                                    });
                                }
                            },
                            _react2.default.createElement(Icon, {
                                icon: "times-circle",
                                className: _WidgetsModal2.default.icon
                            })
                        ),
                    _react2.default.createElement(
                        "a",
                        {
                            href: "#",
                            onClick: function onClick() {
                                return _this2.props.hide().then(function() {
                                    return onSelect({
                                        origin: origin,
                                        type: type,
                                        data: data,
                                        settings: settings
                                    });
                                });
                            }
                        },
                        _react2.default.createElement(Icon, {
                            icon: icon,
                            className: _WidgetsModal2.default.icon
                        }),
                        _react2.default.createElement(
                            "span",
                            { className: _WidgetsModal2.default.txt },
                            title
                        )
                    )
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props2 = this.props,
                    _props2$modules = _props2.modules,
                    Modal = _props2$modules.Modal,
                    Button = _props2$modules.Button,
                    Tabs = _props2$modules.Tabs,
                    cms = _props2.services.cms;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            title: "ADD WIDGET",
                            onClose: this.props.hide
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            { noPadding: true },
                            _react2.default.createElement(
                                Tabs,
                                { position: "left" },
                                cms.getWidgetGroups().map(function(_ref) {
                                    var name = _ref.name,
                                        title = _ref.title,
                                        icon = _ref.icon;

                                    return _react2.default.createElement(
                                        Tabs.Tab,
                                        { key: name, label: title, icon: icon },
                                        _react2.default.createElement(
                                            "div",
                                            { className: _WidgetsModal2.default.widgets },
                                            _react2.default.createElement(
                                                "ul",
                                                null,
                                                cms
                                                    .getEditorWidgets(name)
                                                    .map(_this3.renderWidget.bind(_this3))
                                            )
                                        )
                                    );
                                })
                            )
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            null,
                            _react2.default.createElement(Button, {
                                type: "default",
                                label: "Cancel",
                                onClick: this.props.hide
                            })
                        )
                    )
                );
            }
        }
    ]);
    return WidgetsModal;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([WidgetsModal, _webinyAppUi.ModalComponent], {
    modules: ["Modal", "Button", "ButtonGroup", "Tabs", "Icon", "Tooltip"],
    services: ["cms"]
});
//# sourceMappingURL=WidgetsModal.js.map
