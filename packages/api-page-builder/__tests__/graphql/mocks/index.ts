import { SecurityIdentity } from "@webiny/api-security/types";

export const NOT_AUTHORIZED_RESPONSE = (operation: string) => ({
    data: {
        pageBuilder: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

export const identityA: SecurityIdentity = {
    id: "12345678",
    type: "test",
    displayName: "John Doe"
};

export const identityB: SecurityIdentity = {
    id: "87654321",
    type: "test",
    displayName: "Jane Doe"
};
