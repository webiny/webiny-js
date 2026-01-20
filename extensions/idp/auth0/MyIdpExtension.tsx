import React from "react";
import { Auth0 } from "@webiny/auth0";

const MyIdpExtension = () => {
    return (
        <Auth0
            issuer={String(process.env.AUTH0_ISSUER)}
            clientId={String(process.env.AUTH0_CLIENT_ID)}
            apiConfig={import.meta.dirname + "/MyAuth0Config.ts"}
        />
    );
};

export default MyIdpExtension;
