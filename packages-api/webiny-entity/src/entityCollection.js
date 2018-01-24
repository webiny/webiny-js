import { Entity } from ".";

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

    push(value) {
        if (value instanceof Entity) {
            return super.push(value);
        }

        throw Error("Trying to push a value that is not an instance of Entity.");
    }
}

export default EntityCollection;
