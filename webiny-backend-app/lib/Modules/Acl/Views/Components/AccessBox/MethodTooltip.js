"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

var MethodTooltip = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(MethodTooltip, _Webiny$Ui$Component);

    function MethodTooltip() {
        (0, _classCallCheck3.default)(this, MethodTooltip);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (MethodTooltip.__proto__ || Object.getPrototypeOf(MethodTooltip)).apply(this, arguments)
        );
    }

    return MethodTooltip;
})(_webinyClient.Webiny.Ui.Component);

/**
 * @i18n.namespace Webiny.Backend.Acl.MethodTooltip
 */

MethodTooltip.defaultProps = {
    method: null,
    renderer: function renderer() {
        var _this2 = this;

        var _props = this.props,
            Link = _props.Link,
            method = _props.method,
            currentlyEditingPermission = _props.currentlyEditingPermission;

        return _react2.default.createElement(
            "div",
            { className: _styles2.default.detailsTooltip },
            method.name &&
                method.description &&
                _react2.default.createElement(
                    "tooltip-header",
                    null,
                    _react2.default.createElement(
                        "h3",
                        null,
                        method.name,
                        " ",
                        method.public &&
                            _react2.default.createElement(
                                "span",
                                { className: _styles2.default.publicMethod },
                                this.i18n("(public)")
                            )
                    ),
                    method.description &&
                        _react2.default.createElement("div", null, method.description),
                    _react2.default.createElement("br", null)
                ),
            _react2.default.createElement("h3", null, this.i18n("Execution:")),
            _react2.default.createElement(
                "div",
                null,
                _react2.default.createElement(
                    "div",
                    { className: _styles2.default.methodBox },
                    method.method
                ),
                method.path
            ),
            _react2.default.createElement("br", null),
            _lodash2.default.isEmpty(method.usages)
                ? _react2.default.createElement(
                      "wrapper",
                      null,
                      _react2.default.createElement("h3", null, this.i18n("Usages")),
                      _react2.default.createElement("div", null, "No usages.")
                  )
                : _react2.default.createElement(
                      "wrapper",
                      null,
                      _react2.default.createElement(
                          "h3",
                          null,
                          this.i18n("Usages ({total}):", { total: method.usages.length })
                      ),
                      _react2.default.createElement(
                          "div",
                          null,
                          _react2.default.createElement(
                              "table",
                              { className: _styles2.default.usagesTable },
                              _react2.default.createElement(
                                  "thead",
                                  null,
                                  _react2.default.createElement(
                                      "tr",
                                      null,
                                      _react2.default.createElement(
                                          "th",
                                          null,
                                          this.i18n("Permission")
                                      ),
                                      _react2.default.createElement("th", null, this.i18n("Roles"))
                                  )
                              ),
                              _react2.default.createElement(
                                  "tbody",
                                  null,
                                  method.usages.map(function(permission) {
                                      return _react2.default.createElement(
                                          "tr",
                                          { key: permission.id },
                                          _react2.default.createElement(
                                              "td",
                                              null,
                                              permission.id === currentlyEditingPermission.id
                                                  ? _react2.default.createElement(
                                                        "span",
                                                        null,
                                                        permission.name
                                                    )
                                                  : _react2.default.createElement(
                                                        Link,
                                                        {
                                                            separate: true,
                                                            route: "UserPermissions.Edit",
                                                            params: { id: permission.id }
                                                        },
                                                        permission.name
                                                    )
                                          ),
                                          _react2.default.createElement(
                                              "td",
                                              {
                                                  className: _this2.classSet(
                                                      (0, _defineProperty3.default)(
                                                          {},
                                                          _styles2.default.moreRoles,
                                                          true
                                                      )
                                                  )
                                              },
                                              permission.roles.map(function(role) {
                                                  return _react2.default.createElement(
                                                      Link,
                                                      {
                                                          separate: true,
                                                          key: role.id,
                                                          route: "UserRoles.Edit",
                                                          params: { id: role.id }
                                                      },
                                                      role.name
                                                  );
                                              })
                                          )
                                      );
                                  })
                              )
                          )
                      )
                  )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(MethodTooltip, {
    modules: ["Link"]
});
//# sourceMappingURL=MethodTooltip.js.map
