// @flow
import { Entity } from ".";

class EntityPoolEntry {
    entity: Entity;
    meta: Object;

    constructor(entity: $Subtype<Entity>) {
        this.entity = entity;
        this.meta = {
            createdOn: new Date()
        };
    }

    getEntity(): $Subtype<Entity> {
        return this.entity;
    }

    setEntity(entity: $Subtype<Entity>): this {
        this.entity = entity;
        return this;
    }

    getMeta(): Object {
        return this.meta;
    }

    setMeta(meta: Object): this {
        this.meta = meta;
        return this;
    }
}

export default EntityPoolEntry;
