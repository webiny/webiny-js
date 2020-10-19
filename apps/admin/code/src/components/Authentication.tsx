import React from "react";
import CognitoAuthentication from "@webiny/app-plugin-security-cognito/Authentication";
import { LOGIN } from "@webiny/app-security-user-management/graphql";

export const getIdentityData = async ({ client }) => {
    const { data } = await client.mutate({ mutation: LOGIN });
    return data.security.login.data;
};

const Authentication = ({ children }) => (
    <CognitoAuthentication getIdentityData={getIdentityData}>{children}</CognitoAuthentication>
);

export default Authentication;
