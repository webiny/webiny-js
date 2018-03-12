// @flow
class AuthenticationError extends Error {
    static IDENTITY_INSTANCE_NOT_FOUND: string;
    static INVALID_CREDENTIALS: string;
    static UNKNOWN_IDENTITY: string;
    static UNKNOWN_STRATEGY: string;
    static TOKEN_EXPIRED: string;
    static TOKEN_INVALID: string;
    code: string;
    data: Object;

    constructor(message: string, code: string, data: Object = {}) {
        super();
        this.name = "AuthenticationError";
        this.message = message;
        this.data = data;
        this.code = code;
    }

    toString() {
        return this.name + ": " + this.message;
    }
}

AuthenticationError.IDENTITY_INSTANCE_NOT_FOUND = "IDENTITY_INSTANCE_NOT_FOUND";
AuthenticationError.INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
AuthenticationError.UNKNOWN_IDENTITY = "UNKNOWN_IDENTITY";
AuthenticationError.UNKNOWN_STRATEGY = "UNKNOWN_STRATEGY";
AuthenticationError.TOKEN_EXPIRED = "TOKEN_EXPIRED";
AuthenticationError.TOKEN_INVALID = "TOKEN_INVALID";

export default AuthenticationError;
