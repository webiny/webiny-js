import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { CognitoFeature } from "./presentation/Cognito/feature.js";
import { CognitoAdmin } from "./Cognito.js";

export const Extension = () => {
    const region = process.env.REACT_APP_USER_POOL_REGION || "";
    const userPoolId = process.env.REACT_APP_USER_POOL_ID || "";
    const clientId = process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || "";

    return (
        <>
            <RegisterFeature feature={CognitoFeature} />
            <CognitoAdmin
                login={{
                    region,
                    userPoolId,
                    clientId
                }}
            />
        </>
    );
};
