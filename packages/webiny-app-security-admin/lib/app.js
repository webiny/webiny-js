"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function() {
    return function(_ref, next) {
        var app = _ref.app;

        app.modules.register([
            {
                name: "Admin.UserMenu",
                factory: function factory() {
                    return import("./components/UserMenu");
                },
                tags: ["header-component"]
            },
            {
                name: "Admin.Login",
                factory: function factory() {
                    return import("./views/security/Login");
                }
            },
            {
                name: "Admin.UserMenu.AccountPreferences",
                factory: function factory() {
                    return import("./components/UserMenu/AccountPreferences");
                },
                tags: ["user-menu-item"]
            },
            {
                name: "Admin.UserMenu.Logout",
                factory: function factory() {
                    return import("./components/UserMenu/Logout");
                },
                tags: ["user-logout-menu-item"]
            },
            {
                name: "Admin.UserAccountForm",
                factory: function factory() {
                    return import("./components/UserAccount/UserAccountForm");
                }
            }
        ]);

        app.router.addRoute({
            name: "Me.Account",
            path: "/me/account",
            component: function component() {
                return app.modules.load("Admin.UserAccountForm");
            },
            title: "My Account"
        });

        next();
    };
};
//# sourceMappingURL=app.js.map
