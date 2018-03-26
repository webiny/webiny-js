"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.User
 */
var User = function User(props) {
    if (!props.user) {
        return null;
    }

    var Gravatar = props.Gravatar;

    return _react2.default.createElement(
        "div",
        { className: "user-welcome" },
        _react2.default.createElement(
            "div",
            { className: "user-welcome__avatar" },
            _react2.default.createElement(
                "div",
                { className: "avatar avatar--inline avatar--small" },
                _react2.default.createElement(
                    "span",
                    { className: "avatar-placeholder avatar-placeholder--no-border" },
                    _react2.default.createElement(Gravatar, {
                        className: "avatar img-responsive",
                        hash: props.user.gravatar,
                        size: "50"
                    })
                )
            )
        ),
        _react2.default.createElement(
            "h3",
            { className: "user-welcome__message" },
            _webinyClient.Webiny.I18n("Hi {user}!", {
                user: _lodash2.default.get(
                    props.user,
                    "firstName",
                    _lodash2.default.get(props.user, "email")
                )
            })
        )
    );
};

exports.default = _webinyClient.Webiny.createComponent(User, { modules: ["Gravatar"] });
//# sourceMappingURL=User.js.map
