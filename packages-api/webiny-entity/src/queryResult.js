// @flow
class QueryResult {
    result: mixed;
    meta: ?Object;

    constructor(result: mixed, meta: ?Object) {
        this.result = result;
        this.meta = meta;
    }

    setResult(result: mixed): this {
        this.result = result;
        return this;
    }

    getResult(): mixed {
        return this.result;
    }

    setMeta(meta: Object): this {
        this.meta = meta;
        return this;
    }

    getMeta(): ?Object {
        return this.meta;
    }
}

export default QueryResult;
