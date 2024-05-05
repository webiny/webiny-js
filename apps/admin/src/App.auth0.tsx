import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Auth0 } from "@webiny/app-admin-auth0";
import { AdminPlugins } from "./plugins/scaffolds/AdminPlugins";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Auth0
                auth0={{
                    domain: String(process.env.REACT_APP_AUTH0_DOMAIN),
                    clientId: String(process.env.REACT_APP_AUTH0_CLIENT_ID)
                }}
                rootAppClientId={String(process.env.REACT_APP_AUTH0_CLIENT_ID)}
            />
            <AdminPlugins />
        </Admin>
    );
};
