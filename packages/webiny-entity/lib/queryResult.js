"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class QueryResult {
    constructor(result, meta = {}) {
        this.result = result;
        this.meta = meta;
    }

    setResult(result) {
        this.result = result;
        return this;
    }

    getResult() {
        return this.result;
    }

    setMeta(meta) {
        this.meta = meta;
        return this;
    }

    getMeta() {
        return this.meta;
    }

    setCount(count) {
        this.meta.count = count;
        return this;
    }

    getCount() {
        return this.meta.count;
    }
}

exports.default = QueryResult;
//# sourceMappingURL=queryResult.js.map
