export default class SecurityError extends Error {
    message: string;
    code: string;
    constructor(message = "Not authorized.", code = "SECURITY_ERROR") {
        super();
        this.message = message;
        this.code = code;
    }
}
