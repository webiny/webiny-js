import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Auth0 } from "@webiny/app-admin-auth0";
import { Extensions } from "./Extensions";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Auth0
                autoLogin={() => {
                    const query = new URLSearchParams(window.location.search);
                    return query.get("action") !== "logout";
                }}
                auth0={{
                    domain: String(process.env.REACT_APP_AUTH0_DOMAIN),
                    clientId: String(process.env.REACT_APP_AUTH0_CLIENT_ID)
                }}
                rootAppClientId={String(process.env.REACT_APP_AUTH0_CLIENT_ID)}
                onLogout={logout => {
                    logout({
                        logoutParams: {
                            returnTo: window.location.origin + "?action=logout"
                        }
                    });
                }}
            />
            <Extensions />
        </Admin>
    );
};
