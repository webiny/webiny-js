// @flow
import Entity from "./entity";

class EntityCollection extends Array<mixed> {
    __entityCollection: { params: Object, meta: Object };

    constructor(values: Array<mixed> = []) {
        super();
        this.__entityCollection = { params: {}, meta: {} };
        if (Array.isArray(values)) {
            values.map(item => this.push(item));
        }
    }

    setParams(params: Object): this {
        this.__entityCollection.params = params;
        return this;
    }

    getParams(): Object {
        return this.__entityCollection.params;
    }

    setMeta(meta: Object): this {
        this.__entityCollection.meta = meta;
        return this;
    }

    getMeta(): Object {
        return this.__entityCollection.meta;
    }

    async toJSON(fields: ?string): Promise<Array<mixed>> {
        const collection = this.map(async (entity: mixed) => {
            if (entity instanceof Entity) {
                return await entity.toJSON(fields);
            }
            return entity;
        });

        return Promise.all(collection);
    }

    setTotalCount(totalCount: number): this {
        this.__entityCollection.meta.totalCount = totalCount;
        return this;
    }

    getTotalCount(): ?number {
        return this.__entityCollection.meta.totalCount;
    }
}

export default EntityCollection;
