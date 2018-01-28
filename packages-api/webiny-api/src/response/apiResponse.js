// @flow

class ApiResponse {
    data: mixed;
    message: string;
    statusCode: number;

    constructor(data: mixed = null, message: string = "", statusCode: number = 200) {
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }

    getStatusCode() {
        return this.statusCode;
    }

    setStatusCode(statusCode: number): this {
        this.statusCode = statusCode;
        return this;
    }

    getData(format: boolean = true): Object | mixed {
        return format ? this.formatResponse() : this.data;
    }

    setData(data: mixed): mixed {
        this.data = data;
        return this;
    }

    getMessage(): string {
        return this.message;
    }

    setMessage(message: string): this {
        this.message = message;
        return this;
    }

    toJSON(): Object {
        return this.formatResponse();
    }

    formatResponse(): { data: mixed, message?: string } {
        const data: { data: mixed, message?: string } = {
            data: this.data
        };

        if (this.message) {
            data.message = this.message;
        }

        return data;
    }
}

export default ApiResponse;
