import React from "react";
import { RegisterFeature } from "@webiny/app";
import { CognitoFeature } from "./features/Cognito/CognitoFeature.js";
import { CognitoAdmin } from "./Cognito.js";

export default () => {
    const region = process.env.REACT_APP_COGNITO_REGION || "";
    const userPoolId = process.env.REACT_APP_COGNITO_USER_POOL_ID || "";
    const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID || "";

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
