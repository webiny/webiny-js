// @flow
import { Entity } from ".";
import EntityCollectionError from "./entityCollectionError";

class EntityCollection extends Array<Entity> {
    __entityCollection: { params: Object, meta: Object };

    constructor(values: Array<Entity> = []) {
        super();
        this.__entityCollection = { params: {}, meta: {} };
        values.forEach &&
            values.forEach(item => {
                if (item instanceof Entity) {
                    this.push(item);
                    return true;
                }
                throw new EntityCollectionError(
                    "EntityCollection cannot accept a value that is not an instance of Entity."
                );
            });
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

    async toJSON(fields: string) {
        if (!fields) {
            throw new EntityCollectionError(
                "toJSON must receive fields (eg. 'id,name,createdOn')."
            );
        }

        return Promise.all(this.map(async (entity: Entity) => await entity.toJSON(fields)));
    }

    setCount(count: number): this {
        this.__entityCollection.meta.count = count;
        return this;
    }

    getCount(): ?number {
        return this.__entityCollection.meta.count;
    }
}

export default EntityCollection;
