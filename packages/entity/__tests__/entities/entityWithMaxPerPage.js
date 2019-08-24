import Entity from "@webiny/entity/entity";

class EntityWithoutMaxPerPage extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithoutMaxPerPage.classId = "EntityWithoutLogs";

class EntityWithMaxPerPage extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithMaxPerPage.classId = "EntityWithMaxPerPage";
EntityWithMaxPerPage.crud = {
    read: {
        maxPerPage: 500
    }
};

class EntityWithMaxPerPageSetToNull extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

EntityWithMaxPerPageSetToNull.classId = "EntityWithMaxPerPageSetToNull";
EntityWithMaxPerPageSetToNull.crud = {
    read: {
        maxPerPage: null
    }
};

export { EntityWithoutMaxPerPage, EntityWithMaxPerPage, EntityWithMaxPerPageSetToNull };
