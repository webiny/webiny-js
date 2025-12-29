import { Components as BaseComponents } from "@webiny/app-admin-cognito";
export * from "./createAuthentication/index.js";
export { Cognito } from "./Cognito.js";
export { CognitoLogin } from "./CognitoLogin.js";

import { NotAuthorizedError } from "./createAuthentication/NotAuthorizedError/index.js";

export const Components = {
    ...BaseComponents,
    NotAuthorizedError
};
