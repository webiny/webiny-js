// @flow
class AuthError {
    static INVALID_CREDENTIALS: string;
    message: string;
    type: string;
    data: Object;

    constructor(message: string, type: string = '', data: Object = {}) {
        this.message = message;
        this.data = data;
        this.type = type;
    }

    setMessage(message: string): void {
        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    setData(data: Object): void {
        this.data = data;
    }

    getData(): Object {
        return this.data;
    }

    setType(type: string): void {
        this.type = type;
    }

    getType(): string {
        return this.type;
    }
}

AuthError.INVALID_CREDENTIALS = 'invalidCredentials';

export default AuthError;