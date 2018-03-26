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
 * @i18n.namespace Webiny.Backend.UserPermissions
 */
var UserPermissions = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(UserPermissions, _Webiny$Ui$Component);

    function UserPermissions(props) {
        (0, _classCallCheck3.default)(this, UserPermissions);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UserPermissions.__proto__ || Object.getPrototypeOf(UserPermissions)).call(this, props)
        );

        _this.state = {
            permissions: []
        };
        return _this;
    }

    (0, _createClass3.default)(UserPermissions, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    UserPermissions.prototype.__proto__ ||
                        Object.getPrototypeOf(UserPermissions.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                new _webinyClient.Webiny.Api.Endpoint(this.props.api)
                    .get("/", { _perPage: 1000, _sort: "name" })
                    .then(function(apiResponse) {
                        _this2.setState({ permissions: apiResponse.getData("list") });
                    });
            }
        },
        {
            key: "onChange",
            value: function onChange(index, permission, enabled) {
                var value = this.props.value || [];
                if (enabled) {
                    value.push(permission);
                } else {
                    value.splice(index, 1);
                }
                this.props.onChange(value);
            }
        }
    ]);
    return UserPermissions;
})(_webinyClient.Webiny.Ui.Component);

UserPermissions.defaultProps = {
    api: "/entities/webiny/user-permissions",
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
            { data: this.state.permissions },
            _react2.default.createElement(
                List.Table.Row,
                null,
                _react2.default.createElement(List.Table.Field, { style: { width: 140 } }, function(
                    _ref
                ) {
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
                }),
                _react2.default.createElement(
                    List.Table.Field,
                    { label: this.i18n("Permission") },
                    function(_ref2) {
                        var data = _ref2.data;
                        return _react2.default.createElement(
                            "span",
                            null,
                            _react2.default.createElement(
                                Link,
                                { route: "UserPermissions.Edit", params: { id: data.id } },
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

exports.default = _webinyClient.Webiny.createComponent(UserPermissions, {
    modules: ["List", "Switch", "Link"]
});
//# sourceMappingURL=index.js.map
