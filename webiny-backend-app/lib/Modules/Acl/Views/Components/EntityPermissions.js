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

var _EntityBox = require("./AccessBox/EntityBox");

var _EntityBox2 = _interopRequireDefault(_EntityBox);

var _AddEntityModal = require("./AddEntityModal");

var _AddEntityModal2 = _interopRequireDefault(_AddEntityModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.EntityPermissions
 */
var EntityPermissions = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(EntityPermissions, _Webiny$Ui$Component);

    function EntityPermissions() {
        (0, _classCallCheck3.default)(this, EntityPermissions);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (EntityPermissions.__proto__ || Object.getPrototypeOf(EntityPermissions)).call(this)
        );

        _this.state = {
            entities: [],
            loading: false
        };

        _this.api = new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/user-permissions");
        return _this;
    }

    (0, _createClass3.default)(EntityPermissions, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    EntityPermissions.prototype.__proto__ ||
                        Object.getPrototypeOf(EntityPermissions.prototype),
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
                            .get("/entity")
                            .then(function(apiResponse) {
                                _this2.setState({
                                    loading: false,
                                    entities: apiResponse.getData()
                                });
                            });
                    });
                }
            }
        }
    ]);
    return EntityPermissions;
})(_webinyClient.Webiny.Ui.Component);

EntityPermissions.defaultProps = {
    model: null,
    onTogglePermission: _lodash2.default.noop,
    onAddEntity: _lodash2.default.noop,
    onRemoveEntity: _lodash2.default.noop,
    renderer: function renderer() {
        var _this3 = this;

        var _props = this.props,
            Loader = _props.Loader,
            Button = _props.Button,
            ViewSwitcher = _props.ViewSwitcher,
            Grid = _props.Grid,
            Icon = _props.Icon,
            permissions = _props.permissions;

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
                        { className: _styles2.default.entityPermissionsWrapper },
                        _this3.state.loading && _react2.default.createElement(Loader, null),
                        _react2.default.createElement(
                            Grid.Row,
                            { className: _styles2.default.addAction },
                            _react2.default.createElement(
                                Grid.Col,
                                { all: 12, className: "text-center" },
                                _react2.default.createElement(
                                    Button,
                                    { type: "primary", onClick: showView("addEntityModal") },
                                    _react2.default.createElement(Icon, {
                                        icon: "icon-plus-circled"
                                    }),
                                    _this3.i18n("Add entity")
                                )
                            )
                        ),
                        _lodash2.default.isEmpty(_this3.state.entities)
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
                                              _this3.i18n("No entities selected.")
                                          ),
                                          _react2.default.createElement(
                                              "p",
                                              null,
                                              _this3.i18n(
                                                  "To manage access, please add an entity first."
                                              )
                                          )
                                      )
                                  )
                              )
                            : _react2.default.createElement(
                                  Grid.Row,
                                  { className: _styles2.default.accessBoxesWrapper },
                                  _this3.state.entities.map(function(entity) {
                                      var entityPermissions = _lodash2.default.find(
                                          _this3.props.model.permissions,
                                          { classId: entity.classId }
                                      );
                                      return _react2.default.createElement(_EntityBox2.default, {
                                          currentlyEditingPermission: _this3.props.model,
                                          onTogglePermission: function onTogglePermission(
                                              entity,
                                              method
                                          ) {
                                              return _this3.props.onTogglePermission(
                                                  entity,
                                                  method
                                              );
                                          },
                                          onRemoveEntity: function onRemoveEntity(entity) {
                                              var index = _lodash2.default.findIndex(
                                                  _this3.state.entities,
                                                  { classId: entity.classId }
                                              );
                                              var entities = _lodash2.default.clone(
                                                  _this3.state.entities
                                              );
                                              entities.splice(index, 1);
                                              _this3.setState({ entities: entities }, function() {
                                                  _this3.props.onRemoveEntity(entity);
                                                  _webinyClient.Webiny.Growl.success(
                                                      _this3.i18n("Entity removed successfully!")
                                                  );
                                              });
                                          },
                                          key: entity.classId,
                                          entity: entity,
                                          permissions: _lodash2.default.get(
                                              entityPermissions,
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
                { view: "addEntityModal", modal: true },
                function() {
                    return _react2.default.createElement(_AddEntityModal2.default, {
                        exclude: _this3.state.entities,
                        onSubmit: function onSubmit(entity) {
                            _this3.setState(
                                {
                                    entities: _lodash2.default
                                        .clone(_this3.state.entities)
                                        .concat([entity])
                                },
                                function() {
                                    _this3.props.onAddEntity(entity);
                                    _webinyClient.Webiny.Growl.success(
                                        _this3.i18n("Entity was added successfully!")
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

exports.default = _webinyClient.Webiny.createComponent(EntityPermissions, {
    modules: ["Input", "Button", "ViewSwitcher", "Grid", "Icon", "Loader"]
});
//# sourceMappingURL=EntityPermissions.js.map
