class EntityCollection extends Array {
    constructor(values = []) {
        super();
        if (!values.forEach) {
            values = [];
        }
        values.forEach(v => this.push(v));
        this.entityCollection = {
            params: null,
            meta: null
        };
    }

    setParams(params) {
        this.entityCollection.params = params;
        return this;
    }

    getParams() {
        return this.entityCollection.params;
    }

    setMeta(meta) {
        this.entityCollection.meta = meta;
        return this;
    }

    getMeta() {
        return this.entityCollection.meta;
    }
}

export default EntityCollection;