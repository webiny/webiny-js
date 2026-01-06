import React from "react";
import { Okta } from "@webiny/okta";

export const MyIdpExtension = () => {
    return (
        <Okta
            issuer={String(process.env.OKTA_ISSUER)}
            clientId={String(process.env.OKTA_CLIENT_ID)}
            apiConfig={import.meta.dirname + "/MyOktaConfig.ts"}
        />
    );
};
