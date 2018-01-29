// @flow
class AuthError {
    static INVALID_CREDENTIALS: string;
    message: string;
    type: string;
    data: Object;

    constructor(message: string = "", type: string = "", data: Object = {}) {
        this.message = message;
        this.data = data;
        this.type = type;
    }
}

AuthError.INVALID_CREDENTIALS = "invalidCredentials";

export default AuthError;
