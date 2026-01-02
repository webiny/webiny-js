import React from "react";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { Auth0 } from "./Auth0.js";
import { Auth0Feature } from "./features/Auth0/feature.js";

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={Auth0Feature} />
            <Auth0
                auth0={{
                    domain: String(process.env.REACT_APP_AUTH0_ISSUER),
                    clientId: String(process.env.REACT_APP_AUTH0_CLIENT_ID)
                }}
            />
        </>
    );
};
