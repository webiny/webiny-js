import React from "react";
import adminTemplate from "./Template";
import { Route } from "@webiny/react-router";
import SlateView from "./SlateView";
import "./App.scss";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import editorPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor";

export default adminTemplate({
    defaultRoute: "/slate",
    cognito: {
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    },
    plugins: [
        editorPlugins,
        {
            type: "route",
            name: "route-slate",
            route: (
                <Route
                    exact
                    path={"/slate"}
                    render={() => (
                        <AdminLayout>
                            <SlateView />
                        </AdminLayout>
                    )}
                />
            )
        }
    ]
});
