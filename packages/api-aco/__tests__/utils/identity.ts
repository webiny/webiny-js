import { SecurityIdentity } from "@webiny/api-security/types";

export const createIdentity = (): SecurityIdentity => {
    return {
        id: "12345678",
        type: "admin",
        displayName: "John Doe"
    };
};
