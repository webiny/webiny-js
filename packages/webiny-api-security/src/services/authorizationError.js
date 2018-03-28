// @flow
class AuthorizationError extends Error {
    static NOT_AUTHORIZED: string;
    code: string;

    constructor(message: string, code: string) {
        super();
        this.name = "AuthorizationError";
        this.message = message;
        this.code = code;
    }
}

AuthorizationError.NOT_AUTHORIZED = "NOT_AUTHORIZED";

export default AuthorizationError;
