export default () => {
    return ({ app }, next) => {
        app.modules.register([
            {
                name: "Admin.UserMenu",
                factory: () => import("./components/UserMenu"),
                tags: ["header-component"]
            },
            {
                name: "Admin.Login",
                factory: () => import("./views/security/Login")
            },
            {
                name: "Admin.UserMenu.AccountPreferences",
                factory: () => import("./components/UserMenu/AccountPreferences"),
                tags: ["user-menu-item"]
            },
            {
                name: "Admin.UserMenu.Logout",
                factory: () => import("./components/UserMenu/Logout"),
                tags: ["user-logout-menu-item"]
            },
            {
                name: "Admin.UserAccountForm",
                factory: () => import("./components/UserAccount/UserAccountForm")
            }
        ]);

        app.router.addRoute({
            name: "Me.Account",
            path: "/me/account",
            component: () => app.modules.load("Admin.UserAccountForm"),
            title: "My Account"
        });

        next();
    };
};
