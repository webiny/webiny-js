// @flow
class EntityCollection extends Array<Entity> {
    entityCollection: { params: ?Object, meta: ?Object };
    constructor(values: Array<Entity> = []) {
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

    setParams(params: Object): this {
        this.entityCollection.params = params;
        return this;
    }

    getParams(): ?Object {
        return this.entityCollection.params;
    }

    setMeta(meta: ?Object): this {
        this.entityCollection.meta = meta;
        return this;
    }

    getMeta(): ?Object {
        return this.entityCollection.meta;
    }
}

export default EntityCollection;
