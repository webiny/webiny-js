// @flow
import { Entity } from ".";
import EntityCollectionError from "./entityCollectionError";

class EntityCollection extends Array<Entity> {
    entityCollection: { params: ?Object, meta: ?Object };

    constructor(values: Array<Entity> = []) {
        super();
        this.entityCollection = { params: null, meta: null };
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
}

export default EntityCollection;
