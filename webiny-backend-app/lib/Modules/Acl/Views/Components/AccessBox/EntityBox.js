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
var EntityBox = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(EntityBox, _Webiny$Ui$Component);

    function EntityBox(props) {
        (0, _classCallCheck3.default)(this, EntityBox);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (EntityBox.__proto__ || Object.getPrototypeOf(EntityBox)).call(this, props)
        );

        _this.state = { entityFilter: "" };

        _this.crud = {
            create: "/.post",
            read: "{id}.get",
            list: "/.get",
            update: "{id}.patch",
            delete: "{id}.delete"
        };
        return _this;
    }

    /**
     * Renders toggle buttons for basic CRUD API endpoints (if they exist on given entity).
     */

    (0, _createClass3.default)(EntityBox, [
        {
            key: "renderCrudMethods",
            value: function renderCrudMethods() {
                var _props = this.props,
                    Tooltip = _props.Tooltip,
                    entity = _props.entity,
                    permissions = _props.permissions,
                    onTogglePermission = _props.onTogglePermission,
                    currentlyEditingPermission = _props.currentlyEditingPermission;

                var existingOperations = {
                    c: _lodash2.default.find(entity.methods, { key: this.crud.create }),
                    r:
                        _lodash2.default.find(entity.methods, { key: this.crud.get }) ||
                        _lodash2.default.find(entity.methods, { key: this.crud.list }),
                    u: _lodash2.default.find(entity.methods, { key: this.crud.update }),
                    d: _lodash2.default.find(entity.methods, { key: this.crud.delete })
                };

                var buttons = [];
                _lodash2.default.each(existingOperations, function(method, key) {
                    if (method && !method.custom) {
                        buttons.push(
                            _react2.default.createElement(
                                Tooltip,
                                {
                                    interactive: true,
                                    placement: "top",
                                    key: key,
                                    target: _react2.default.createElement(
                                        _ToggleAccessButton2.default,
                                        {
                                            method: method,
                                            onClick: function onClick() {
                                                return onTogglePermission(entity.classId, key);
                                            },
                                            value: permissions[key]
                                        }
                                    )
                                },
                                _react2.default.createElement(_MethodTooltip2.default, {
                                    method: method,
                                    currentlyEditingPermission: currentlyEditingPermission
                                })
                            )
                        );
                    }
                });

                return _react2.default.createElement("div", null, buttons);
            }

            /**
             * Renders toggle buttons for custom API endpoints (if they exist on given entity).
             */
        },
        {
            key: "renderCustomMethods",
            value: function renderCustomMethods() {
                var _this2 = this;

                var _props2 = this.props,
                    Input = _props2.Input,
                    Tooltip = _props2.Tooltip,
                    entity = _props2.entity,
                    permissions = _props2.permissions,
                    currentlyEditingPermission = _props2.currentlyEditingPermission,
                    onTogglePermission = _props2.onTogglePermission;

                var customMethods = [];

                _lodash2.default.each(entity.methods, function(method) {
                    if (!method.custom) {
                        return true;
                    }
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
                            this.bindTo("entityFilter"),
                            { delay: 0 }
                        )
                    )
                );

                var methods = customMethods.map(function(method) {
                    if (method.url.indexOf(_this2.state.entityFilter.toLowerCase()) === -1) {
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
                                            return onTogglePermission(entity.classId, method.key);
                                        },
                                        value: _lodash2.default.get(permissions, method.key)
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
    return EntityBox;
})(_webinyClient.Webiny.Ui.Component);

EntityBox.defaultProps = {
    currentlyEditingPermission: null,
    entity: {},
    permissions: {},
    onTogglePermission: _lodash2.default.noop,
    onRemoveEntity: _lodash2.default.noop,
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
                        this.props.entity.classId,
                        _react2.default.createElement("br", null),
                        _react2.default.createElement("small", null, this.props.entity.class)
                    ),
                    _react2.default.createElement(
                        ClickConfirm,
                        {
                            onComplete: function onComplete() {
                                return _this3.props.onRemoveEntity(_this3.props.entity);
                            },
                            message: this.i18n("Are you sure you want to remove {entity}?", {
                                entity: _react2.default.createElement(
                                    "strong",
                                    null,
                                    this.props.entity.classId
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
                    this.renderCrudMethods(),
                    this.renderCustomMethods()
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(EntityBox, {
    modules: ["Input", "ClickConfirm", "Tooltip"]
});
//# sourceMappingURL=EntityBox.js.map
