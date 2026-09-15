import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { CognitoSignInFeature } from "./presentation/Cognito/signInFeature.js";

export const SignInExtension = () => {
    return <RegisterFeature feature={CognitoSignInFeature} />;
};
