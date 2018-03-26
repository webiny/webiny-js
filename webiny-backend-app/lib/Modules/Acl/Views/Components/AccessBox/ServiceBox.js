"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

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

var _ToggleAccessButton = require("./ToggleAccessButton");

var _ToggleAccessButton2 = _interopRequireDefault(_ToggleAccessButton);

var _MethodTooltip = require("./MethodTooltip");

var _MethodTooltip2 = _interopRequireDefault(_MethodTooltip);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.EntityBox
 */
var ServiceBox = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(ServiceBox, _Webiny$Ui$Component);

    function ServiceBox(props) {
        (0, _classCallCheck3.default)(this, ServiceBox);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ServiceBox.__proto__ || Object.getPrototypeOf(ServiceBox)).call(this, props)
        );

        _this.state = { serviceFilter: "" };
        return _this;
    }

    /**
     * Renders toggle buttons for custom API endpoints (if they exist on given service).
     */

    (0, _createClass3.default)(ServiceBox, [
        {
            key: "renderCustomMethods",
            value: function renderCustomMethods() {
                var _this2 = this;

                var _props = this.props,
                    Input = _props.Input,
                    Tooltip = _props.Tooltip,
                    service = _props.service,
                    permissions = _props.permissions,
                    currentlyEditingPermission = _props.currentlyEditingPermission,
                    onTogglePermission = _props.onTogglePermission;

                var customMethods = [];

                _lodash2.default.each(service.methods, function(method) {
                    var exposed = _lodash2.default.get(permissions, method.key, false);
                    customMethods.push(_lodash2.default.assign({}, method, { exposed: exposed }));
                });

                var header = _react2.default.createElement(
                    "h2",
                    { className: _styles2.default.customMethodsTitle },
                    this.i18n("Custom methods")
                );
                var content = _react2.default.createElement(
                    "div",
                    { className: _styles2.default.noCustomMethods },
                    this.i18n("No custom methods.")
                );

                if (_lodash2.default.isEmpty(customMethods)) {
                    return _react2.default.createElement(
                        "div",
                        { className: _styles2.default.customMethods },
                        _react2.default.createElement("header", null, header),
                        content
                    );
                }

                header = _react2.default.createElement(
                    "span",
                    null,
                    _react2.default.createElement(
                        "h2",
                        { className: _styles2.default.customMethodsTitle },
                        this.i18n("Custom methods")
                    ),
                    _react2.default.createElement(
                        Input,
                        (0, _extends3.default)(
                            { placeholder: this.i18n("Filter methods...") },
                            this.bindTo("serviceFilter"),
                            { delay: 0 }
                        )
                    )
                );

                var methods = customMethods.map(function(method) {
                    if (method.url.indexOf(_this2.state.serviceFilter.toLowerCase()) === -1) {
                        return;
                    }

                    return _react2.default.createElement(
                        "li",
                        { key: method.key, className: _styles2.default.customMethodListItem },
                        _react2.default.createElement(
                            Tooltip,
                            {
                                interactive: true,
                                target: _react2.default.createElement(
                                    _ToggleAccessButton2.default,
                                    {
                                        label: _this2.i18n("E"),
                                        key: method.key,
                                        method: method,
                                        onClick: function onClick() {
                                            return onTogglePermission(service.classId, method.key);
                                        },
                                        value: method.exposed
                                    }
                                )
                            },
                            _react2.default.createElement(_MethodTooltip2.default, {
                                method: method,
                                currentlyEditingPermission: currentlyEditingPermission
                            })
                        ),
                        _react2.default.createElement(
                            "div",
                            { className: _styles2.default.methodDetails },
                            _react2.default.createElement(
                                "div",
                                { className: _styles2.default.methodTypeLabel },
                                method.method.toUpperCase()
                            ),
                            _react2.default.createElement(
                                "div",
                                { title: method.path, className: _styles2.default.methodPathLabel },
                                method.path
                            )
                        ),
                        _react2.default.createElement("div", { className: "clearfix" })
                    );
                });

                // Filter out undefined values (when method filtering is active)
                methods = _lodash2.default.filter(methods, function(item) {
                    return !_lodash2.default.isUndefined(item);
                });
                content = _lodash2.default.isEmpty(methods)
                    ? _react2.default.createElement(
                          "div",
                          { className: _styles2.default.noCustomMethods },
                          this.i18n("Nothing to show.")
                      )
                    : _react2.default.createElement(
                          "ul",
                          { className: _styles2.default.customMethodsList },
                          methods
                      );

                return _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement("header", null, header),
                    content
                );
            }
        }
    ]);
    return ServiceBox;
})(_webinyClient.Webiny.Ui.Component);

ServiceBox.defaultProps = {
    currentlyEditingPermission: null,
    service: {},
    permissions: {},
    onTogglePermission: _lodash2.default.noop,
    onRemoveService: _lodash2.default.noop,
    renderer: function renderer() {
        var _this3 = this;

        var ClickConfirm = this.props.ClickConfirm;

        return _react2.default.createElement(
            "div",
            { className: "col-lg-4 col-md-6 col-sm-12 col-xs-12" },
            _react2.default.createElement(
                "div",
                { className: _styles2.default.box },
                _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement(
                        "h1",
                        { className: _styles2.default.title },
                        this.props.service.classId,
                        _react2.default.createElement("br", null),
                        _react2.default.createElement("small", null, this.props.service.class)
                    ),
                    _react2.default.createElement(
                        ClickConfirm,
                        {
                            onComplete: function onComplete() {
                                return _this3.props.onRemoveService(_this3.props.service);
                            },
                            message: this.i18n("Are you sure you want to remove {service}?", {
                                service: _react2.default.createElement(
                                    "strong",
                                    null,
                                    this.props.service.classId
                                )
                            })
                        },
                        _react2.default.createElement(
                            "span",
                            {
                                onClick: _lodash2.default.noop,
                                className: _styles2.default.removeButton
                            },
                            "\xD7"
                        )
                    ),
                    this.renderCustomMethods()
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(ServiceBox, {
    modules: ["Input", "ClickConfirm", "Tooltip"]
});
//# sourceMappingURL=ServiceBox.js.map
