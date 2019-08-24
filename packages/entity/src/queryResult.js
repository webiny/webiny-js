// @flow
class QueryResult {
    result: mixed;
    meta: Object;

    constructor(result: mixed, meta: Object = {}) {
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

    getMeta(): Object {
        return this.meta;
    }

    setCount(count: number): this {
        this.meta.count = count;
        return this;
    }

    getCount(): number {
        return this.meta.count;
    }
}

export default QueryResult;
