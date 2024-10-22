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
                    return false;
                }}
                auth0={{
                    domain: String(process.env.WEBINY_ADMIN_AUTH0_DOMAIN),
                    clientId: String(process.env.WEBINY_ADMIN_AUTH0_CLIENT_ID)
                }}
                rootAppClientId={String(process.env.WEBINY_ADMIN_AUTH0_CLIENT_ID)}
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
