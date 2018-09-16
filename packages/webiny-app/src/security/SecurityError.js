// @flow
class SecurityError extends Error {
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
        return this.message;
    }
}

export default SecurityError;
