import Entity from "./../../lib/entity";

class EntityWithoutSoftDeletes extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithoutSoftDeletes.classId = "EntityWithoutSoftDeletes";

class EntityWithSoftDeletes extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithSoftDeletes.classId = "EntityWithSoftDeletes";
EntityWithSoftDeletes.crud = {
    delete: {
        soft: true
    }
};

export { EntityWithoutSoftDeletes, EntityWithSoftDeletes };
