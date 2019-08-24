import Entity from "@webiny/entity/entity";

class EntityWithoutLogs extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithoutLogs.classId = "EntityWithoutLogs";

class EntityWithLogs extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithLogs.classId = "EntityWithLogs";
EntityWithLogs.crud = {
    logs: true
};

export { EntityWithoutLogs, EntityWithLogs };
