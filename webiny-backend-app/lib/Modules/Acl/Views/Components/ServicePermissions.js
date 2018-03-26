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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

var _ServiceBox = require("./AccessBox/ServiceBox");

var _ServiceBox2 = _interopRequireDefault(_ServiceBox);

var _AddServiceModal = require("./AddServiceModal");

var _AddServiceModal2 = _interopRequireDefault(_AddServiceModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.ServicePermissions
 */
var ServicePermissions = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(ServicePermissions, _Webiny$Ui$Component);

    function ServicePermissions() {
        (0, _classCallCheck3.default)(this, ServicePermissions);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ServicePermissions.__proto__ || Object.getPrototypeOf(ServicePermissions)).call(this)
        );

        _this.state = {
            services: [],
            loading: false
        };

        _this.api = new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/user-permissions");
        return _this;
    }

    (0, _createClass3.default)(ServicePermissions, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    ServicePermissions.prototype.__proto__ ||
                        Object.getPrototypeOf(ServicePermissions.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                if (!_lodash2.default.isEmpty(this.props.model.permissions)) {
                    this.setState({ loading: true }, function() {
                        _this2.api
                            .setQuery({
                                classIds: _lodash2.default.map(
                                    _this2.props.model.permissions,
                                    "classId"
                                )
                            })
                            .get("/service")
                            .then(function(apiResponse) {
                                _this2.setState({
                                    loading: false,
                                    services: apiResponse.getData()
                                });
                            });
                    });
                }
            }
        }
    ]);
    return ServicePermissions;
})(_webinyClient.Webiny.Ui.Component);

ServicePermissions.defaultProps = {
    model: null,
    onTogglePermission: _lodash2.default.noop,
    onAddService: _lodash2.default.noop,
    onRemoveService: _lodash2.default.noop,
    renderer: function renderer() {
        var _this3 = this;

        var _props = this.props,
            Loader = _props.Loader,
            Button = _props.Button,
            ViewSwitcher = _props.ViewSwitcher,
            Grid = _props.Grid,
            Icon = _props.Icon;

        return _react2.default.createElement(
            ViewSwitcher,
            null,
            _react2.default.createElement(
                ViewSwitcher.View,
                { view: "form", defaultView: true },
                function(_ref) {
                    var showView = _ref.showView;
                    return _react2.default.createElement(
                        "div",
                        { className: _styles2.default.servicePermissionsWrapper },
                        _this3.state.loading && _react2.default.createElement(Loader, null),
                        _react2.default.createElement(
                            Grid.Row,
                            { className: _styles2.default.addAction },
                            _react2.default.createElement(
                                Grid.Col,
                                { all: 12, className: "text-center" },
                                _react2.default.createElement(
                                    Button,
                                    { type: "primary", onClick: showView("addServiceModal") },
                                    _react2.default.createElement(Icon, {
                                        icon: "icon-plus-circled"
                                    }),
                                    _this3.i18n("Add service")
                                )
                            )
                        ),
                        _lodash2.default.isEmpty(_this3.state.services)
                            ? _react2.default.createElement(
                                  Grid.Row,
                                  null,
                                  _react2.default.createElement(
                                      Grid.Col,
                                      { all: 12, className: "text-center" },
                                      _react2.default.createElement(
                                          "div",
                                          null,
                                          _react2.default.createElement(
                                              "h2",
                                              null,
                                              _this3.i18n("No services selected.")
                                          ),
                                          _react2.default.createElement(
                                              "p",
                                              null,
                                              _this3.i18n(
                                                  "To manage access, please add a service first."
                                              )
                                          )
                                      )
                                  )
                              )
                            : _react2.default.createElement(
                                  Grid.Row,
                                  { className: _styles2.default.accessBoxesWrapper },
                                  _this3.state.services.map(function(service) {
                                      var servicePermissions = _lodash2.default.find(
                                          _this3.props.model.permissions,
                                          { classId: service.classId }
                                      );
                                      return _react2.default.createElement(_ServiceBox2.default, {
                                          currentlyEditingPermission: _this3.props.model,
                                          onTogglePermission: function onTogglePermission(
                                              service,
                                              method
                                          ) {
                                              return _this3.props.onTogglePermission(
                                                  service,
                                                  method
                                              );
                                          },
                                          onRemoveService: function onRemoveService(service) {
                                              var index = _lodash2.default.findIndex(
                                                  _this3.state.services,
                                                  { classId: service.classId }
                                              );
                                              var services = _lodash2.default.clone(
                                                  _this3.state.services
                                              );
                                              services.splice(index, 1);
                                              _this3.setState({ services: services }, function() {
                                                  _this3.props.onRemoveService(service);
                                                  _webinyClient.Webiny.Growl.success(
                                                      _this3.i18n("Service removed successfully!")
                                                  );
                                              });
                                          },
                                          key: service.classId,
                                          service: service,
                                          permissions: _lodash2.default.get(
                                              servicePermissions,
                                              "rules",
                                              {}
                                          )
                                      });
                                  })
                              )
                    );
                }
            ),
            _react2.default.createElement(
                ViewSwitcher.View,
                { view: "addServiceModal", modal: true },
                function() {
                    return _react2.default.createElement(_AddServiceModal2.default, {
                        exclude: _this3.state.services,
                        onSubmit: function onSubmit(service) {
                            _this3.setState(
                                {
                                    services: _lodash2.default
                                        .clone(_this3.state.services)
                                        .concat([service])
                                },
                                function() {
                                    _this3.props.onAddService(service);
                                    _webinyClient.Webiny.Growl.success(
                                        _this3.i18n("Service was added successfully!")
                                    );
                                }
                            );
                        }
                    });
                }
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(ServicePermissions, {
    modules: ["Input", "Button", "ViewSwitcher", "Grid", "Icon", "Loader"]
});
//# sourceMappingURL=ServicePermissions.js.map
