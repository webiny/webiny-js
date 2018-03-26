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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.UserRoleGroups
 */
var UserRoleGroups = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(UserRoleGroups, _Webiny$Ui$Component);

    function UserRoleGroups(props) {
        (0, _classCallCheck3.default)(this, UserRoleGroups);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UserRoleGroups.__proto__ || Object.getPrototypeOf(UserRoleGroups)).call(this, props)
        );

        _this.state = {
            roles: []
        };

        _this.bindMethods("onChange");
        return _this;
    }

    (0, _createClass3.default)(UserRoleGroups, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    UserRoleGroups.prototype.__proto__ ||
                        Object.getPrototypeOf(UserRoleGroups.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                new _webinyClient.Webiny.Api.Endpoint(this.props.api)
                    .get("/", { _perPage: 1000, _sort: "name" })
                    .then(function(apiResponse) {
                        if (_this2.isMounted()) {
                            _this2.setState({
                                roles: _lodash2.default.filter(
                                    apiResponse.getData("list"),
                                    function(r) {
                                        return r.slug !== "public";
                                    }
                                )
                            });
                        }
                    });
            }
        },
        {
            key: "onChange",
            value: function onChange(index, role, enabled) {
                var value = this.props.value || [];
                if (enabled) {
                    value.push(role);
                } else {
                    value.splice(index, 1);
                }
                this.props.onChange(value);
            }
        }
    ]);
    return UserRoleGroups;
})(_webinyClient.Webiny.Ui.Component);

UserRoleGroups.defaultProps = {
    api: "/entities/webiny/user-role-groups",
    value: [],
    onChange: _lodash2.default.noop,
    renderer: function renderer() {
        var _this3 = this;

        var _props = this.props,
            List = _props.List,
            Switch = _props.Switch,
            Link = _props.Link;

        return _react2.default.createElement(
            List.Table,
            { data: this.state.roles },
            _react2.default.createElement(
                List.Table.Row,
                null,
                _react2.default.createElement(
                    List.Table.Field,
                    { style: { width: 140 }, align: "center" },
                    function(_ref) {
                        var data = _ref.data;

                        var checkedIndex = _lodash2.default.findIndex(_this3.props.value, {
                            id: data.id
                        });
                        return _react2.default.createElement(Switch, {
                            value: checkedIndex > -1,
                            onChange: function onChange(enabled) {
                                return _this3.onChange(checkedIndex, data, enabled);
                            }
                        });
                    }
                ),
                _react2.default.createElement(
                    List.Table.Field,
                    { label: this.i18n("Role Group") },
                    function(_ref2) {
                        var data = _ref2.data;
                        return _react2.default.createElement(
                            "span",
                            null,
                            _react2.default.createElement(
                                Link,
                                { route: "UserRoleGroups.Edit", params: { id: data.id } },
                                _react2.default.createElement("strong", null, data.name)
                            ),
                            _react2.default.createElement("br", null),
                            data.slug
                        );
                    }
                ),
                _react2.default.createElement(List.Table.Field, {
                    label: this.i18n("Description"),
                    name: "description"
                })
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(UserRoleGroups, {
    modules: ["List", "Switch", "Link"]
});
//# sourceMappingURL=index.js.map
