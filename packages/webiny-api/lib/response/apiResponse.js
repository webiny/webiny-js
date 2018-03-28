"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class ApiResponse {
    constructor(data = null, message = "", statusCode = 200) {
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }

    getStatusCode() {
        return this.statusCode;
    }

    setStatusCode(statusCode) {
        this.statusCode = statusCode;
        return this;
    }

    getData(format = true) {
        return format ? this.formatResponse() : this.data;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    getMessage() {
        return this.message;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }

    toJSON() {
        return this.formatResponse();
    }

    formatResponse() {
        const data = {
            data: this.data
        };

        if (this.message) {
            data.message = this.message;
        }

        return data;
    }

    /**
     * Send output using the express response object
     * @param res
     */
    send(res) {
        res.status(this.statusCode);
        res.json(this.toJSON());
    }
}

exports.default = ApiResponse;
//# sourceMappingURL=apiResponse.js.map
