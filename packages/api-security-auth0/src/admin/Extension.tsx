import React from "react";
import { Auth0 } from "./Auth0.js";

export const Extension = () => {
    return (
        <Auth0
            autoLogin={() => {
                const query = new URLSearchParams(window.location.search);
                return query.get("action") !== "logout";
            }}
            auth0={{
                domain: String(process.env.REACT_APP_AUTH0_ISSUER),
                clientId: String(process.env.REACT_APP_AUTH0_CLIENT_ID)
            }}
            onLogout={logout => {
                logout({
                    logoutParams: {
                        returnTo: window.location.origin + "?action=logout"
                    }
                });
            }}
        />
    );
};
