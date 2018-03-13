// @flow
import Entity from "./entity";
import EntityCollectionError from "./entityCollectionError";

class EntityCollection extends Array<Entity> {
    __entityCollection: { params: Object, meta: Object };

    constructor(values: Array<mixed> = []) {
        super();
        this.__entityCollection = { params: {}, meta: {} };
        if (Array.isArray(values)) {
            values.map(item => {
                if (item instanceof Entity) {
                    this.push(item);
                    return true;
                }
                throw new EntityCollectionError(
                    "EntityCollection cannot accept a value that is not an instance of Entity."
                );
            });
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

    push(value: Entity) {
        if (value instanceof Entity) {
            return super.push(value);
        }

        throw new EntityCollectionError(
            "EntityCollection cannot accept a value that is not an instance of Entity."
        );
    }

    async toJSON(fields: ?string) {
        return Promise.all(this.map(async (entity: Entity) => await entity.toJSON(fields)));
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
