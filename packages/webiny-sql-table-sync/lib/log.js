"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Log {
    constructor(message, data, tags = []) {
        this.message = message;
        this.data = data;
        this.tags = tags;
    }

    getMessage() {
        return this.message;
    }

    getTags() {
        return this.tags;
    }

    getData() {
        return this.data;
    }
}

exports.default = Log;
//# sourceMappingURL=log.js.map
