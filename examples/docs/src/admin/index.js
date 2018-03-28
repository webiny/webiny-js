import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { app, renderMiddleware, Router } from "webiny-app";
import { app as adminApp } from "webiny-app-admin";
import { app as securityApp, authenticationMiddleware } from "webiny-app-security";
import { app as securityAdminApp } from "webiny-app-security-admin";
import configs from "./configs";
import addRoutes from "./routes";

window.app = app;

// Setup admin layout
app.use(adminApp());
// Setup authentication and authorization
app.use(securityApp(configs.security));
// Add admin security components (login route, user account, user menu,...)
app.use(securityAdminApp());

app.configure(() => {
    axios.defaults.baseURL = "http://localhost:9000/api";
});

// Configure app router
app.router.configure({
    basename: "/admin",
    middleware: [
        authenticationMiddleware({
            onNotAuthenticated({ route }, next) {
                if (route.name !== "Login") {
                    app.router.goToRoute("Login");
                }
                next();
            }
        }),
        renderMiddleware()
    ]
});

// Add routes
addRoutes();

// Configure all apps and render Router to run the app
app.setup().then(() => {
    ReactDOM.render(<Router router={app.router} />, document.getElementById("root"));
});
