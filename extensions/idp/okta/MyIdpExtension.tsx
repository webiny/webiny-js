import React from "react";
import { Okta } from "@webiny/okta";

const MyIdpExtension = () => {
    return (
        <Okta
            issuer={String(process.env.OKTA_ISSUER)}
            clientId={String(process.env.OKTA_CLIENT_ID)}
            apiConfig={import.meta.dirname + "/MyOktaConfig.ts"}
        />
    );
};

export default MyIdpExtension;
