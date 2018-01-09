class AuthError {
    constructor(message, type = '', data = {}) {
        this.message = message;
        this.data = data;
        this.type = type;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }

    getMessage() {
        return this.message;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    getData() {
        return this.data;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    getType() {
        return this.type;
    }
}

AuthError.INVALID_CREDENTIALS = 'invalidCredentials';

export default AuthError;