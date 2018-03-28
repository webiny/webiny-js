import React from "react";
import { app } from "webiny-app";
import AdminLayout from "webiny-app-admin/lib/components/Layouts/AdminLayout";

export default () => {
    app.router.addRoute({
        name: "NotMatched",
        path: "*",
        render() {
            return (
                <AdminLayout>
                    <h2>404</h2>
                    <a href="/admin">Go back</a>
                </AdminLayout>
            );
        }
    });

    app.router.addRoute({
        name: "Homepage",
        exact: true,
        path: "/",
        render() {
            return (
                <AdminLayout>
                    <h2>Hi, this is a dummy administration!</h2>
                    <a href="/admin/second-page">Second page</a>
                </AdminLayout>
            );
        }
    });

    app.router.addRoute({
        name: "Login",
        path: "/login",
        exact: true,
        render: () =>
            app.modules.load("Admin.Login").then(Login => {
                return (
                    <Login
                        identity={"user"}
                        strategy={"credentials"}
                        onSuccess={() => {
                            app.router.goToRoute("All");
                        }}
                    />
                );
            }),
        title: "Login"
    });

    app.router.addRoute({
        name: "SecondPage",
        path: "/second-page",
        render() {
            return (
                <AdminLayout>
                    <h2>Second page!</h2>
                    <a href="/admin">Go back</a>
                </AdminLayout>
            );
        }
    });
};
