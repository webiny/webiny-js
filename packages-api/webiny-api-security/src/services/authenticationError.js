// @flow
class AuthenticationError extends Error {
    static IDENTITY_INSTANCE_NOT_FOUND: string;
    static INVALID_CREDENTIALS: string;
    static UNKNOWN_IDENTITY: string;
    static UNKNOWN_STRATEGY: string;
    static TOKEN_EXPIRED: string;
    static TOKEN_INVALID: string;
    type: string;
    data: Object;

    constructor(message: string = "", type: string = "", data: Object = {}) {
        super();
        this.name = "AuthenticationError";
        this.message = message;
        this.data = data;
        this.type = type;
    }
}

AuthenticationError.IDENTITY_INSTANCE_NOT_FOUND = "identityInstanceNotFound";
AuthenticationError.INVALID_CREDENTIALS = "invalidCredentials";
AuthenticationError.UNKNOWN_IDENTITY = "unknownIdentity";
AuthenticationError.UNKNOWN_STRATEGY = "unknownStrategy";
AuthenticationError.TOKEN_EXPIRED = "tokenExpired";
AuthenticationError.TOKEN_INVALID = "tokenInvalid";

export default AuthenticationError;
