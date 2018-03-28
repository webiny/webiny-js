"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _webinyAppSecurity = require("webiny-app-security");

var _menu = require("./services/menu");

var _menu2 = _interopRequireDefault(_menu);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var defaultConfig = {
    security: {
        authentication: {
            cookie: "webiny-token",
            identities: [
                {
                    identity: "user",
                    authenticate: [
                        {
                            strategy: "credentials",
                            apiMethod: "/security/auth/login-user"
                        }
                    ]
                }
            ],
            onLogout: function onLogout() {
                _webinyApp.app.router.goToRoute("Login");
            }
        }
    }
};

exports.default = function() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultConfig;

    return function(params, next) {
        Promise.all([
            new Promise(function(res) {
                return (0, _webinyAppUi.app)()(params, res);
            }),
            new Promise(function(res) {
                return (0, _webinyAppSecurity.app)(config.security)(params, res);
            })
        ]).then(function() {
            _webinyApp.app.services.add("menu", function() {
                return new _menu2.default();
            });

            _webinyApp.app.router.addRoute({
                name: "Me.Account",
                path: "/me/account",
                component: function component() {
                    return _webinyApp.app.modules.load("Skeleton.UserAccountForm");
                },
                title: "My Account"
            });

            _webinyApp.app.modules.register([
                {
                    name: "Skeleton.AdminLayout",
                    factory: function factory() {
                        return import("./components/Layouts/AdminLayout");
                    }
                },
                {
                    name: "Skeleton.EmptyLayout",
                    factory: function factory() {
                        return import("./components/Layouts/EmptyLayout");
                    }
                },
                {
                    name: "Skeleton.UserAccountForm",
                    factory: function factory() {
                        return import("./components/UserAccount/UserAccountForm");
                    }
                },
                {
                    name: "Skeleton.Header",
                    factory: function factory() {
                        return import("./components/Header");
                    }
                },
                {
                    name: "Skeleton.Footer",
                    factory: function factory() {
                        return import("./components/Footer");
                    }
                },
                {
                    name: "Skeleton.Logo",
                    factory: function factory() {
                        return import("./components/Logo");
                    }
                },
                {
                    name: "Skeleton.Navigation",
                    factory: function factory() {
                        return import("./components/Navigation");
                    }
                },
                {
                    name: "Skeleton.Navigation.Desktop",
                    factory: function factory() {
                        return import("./components/Navigation/Desktop");
                    }
                },
                {
                    name: "Skeleton.Navigation.Mobile",
                    factory: function factory() {
                        return import("./components/Navigation/Mobile");
                    }
                },
                {
                    name: "Skeleton.UserMenu",
                    factory: function factory() {
                        return import("./components/UserMenu");
                    }
                },
                {
                    name: "Skeleton.Login",
                    factory: function factory() {
                        return import("./views/security/Login");
                    }
                },
                {
                    name: "Skeleton.UserMenu.AccountPreferences",
                    factory: function factory() {
                        return import("./components/UserMenu/AccountPreferences");
                    },
                    tags: ["user-menu-item"]
                },
                {
                    name: "Skeleton.UserMenu.Logout",
                    factory: function factory() {
                        return import("./components/UserMenu/Logout");
                    },
                    tags: ["user-logout-menu-item"]
                }
            ]);

            next();
        });
    };
};
//# sourceMappingURL=app.js.map
