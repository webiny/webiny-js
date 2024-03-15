import { Components as BaseComponents } from "@webiny/app-admin-cognito";
export * from "./createAuthentication";
export * from "./createGetIdentityData";
export { Cognito } from "./Cognito";
export { CognitoLogin } from "./CognitoLogin";

import { NotAuthorizedError } from "./createAuthentication/NotAuthorizedError";


export const Components = {
    ...BaseComponents,
    NotAuthorizedError
};
