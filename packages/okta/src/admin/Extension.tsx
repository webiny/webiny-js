import React from "react";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { Okta } from "./Okta.js";
import { OktaFeature } from "./features/Okta/feature.js";

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={OktaFeature} />
            <Okta
                okta={{
                    issuer: String(process.env.REACT_APP_OKTA_ISSUER),
                    clientId: String(process.env.REACT_APP_OKTA_CLIENT_ID)
                }}
            />
        </>
    );
};
