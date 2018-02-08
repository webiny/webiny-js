// @flow
class AuthorizationError extends Error {
    static NOT_AUTHORIZED: string;

    constructor(message: string = "", type: string = "") {
        super();
        this.name = "AuthorizationError";
        this.message = message;
        this.type = type;
    }
}

AuthorizationError.NOT_AUTHORIZED = "WBY_NOT_AUTHORIZED";

export default AuthorizationError;
