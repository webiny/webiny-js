// @flow
class QueryResult {
    result: any;
    meta: ?Object;

    constructor(result: any, meta: ?Object) {
        this.result = result;
        this.meta = meta;
    }

    setResult(result: any): this {
        this.result = result;
        return this;
    }

    getResult(): any {
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
