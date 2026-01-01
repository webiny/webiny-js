import { createAuthenticator } from "~/createAuthenticator.js";

export const createOkta = () => {
    return [
        createAuthenticator({
            issuer: "",
            getIdentity: () => ({} as any)
        })
    ];
};
