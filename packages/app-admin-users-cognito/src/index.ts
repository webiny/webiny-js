export * from "./createAuthentication";
export * from "./createGetIdentityData";
export { Cognito } from "./Cognito";

import { NotAuthorizedError } from "./createAuthentication/NotAuthorizedError";

export const Components = {
    NotAuthorizedError
};
