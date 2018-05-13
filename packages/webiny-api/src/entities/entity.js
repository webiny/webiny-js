// @flow
import { app } from "webiny-api";

// TODO: merge webiny-api-security into webiny-api
import { Group } from "webiny-api-security";

import { Entity as BaseEntity } from "webiny-entity";
import RequestEntityPool from "./RequestEntityPool";

class Entity extends BaseEntity {
    constructor() {
        super();
        app.entities.applyExtensions(this);
        this.attr("owner").identity({ classIdAttribute: "ownerClassId" });
        this.attr("groups")
            .entities(Group)
            .setToStorage();
    }
}

Entity.crud = {
    // This is false because it's being handled by the platform (because of the security).
    logs: true,
    delete: {
        soft: true
    }
};

Entity.pool = new RequestEntityPool();
export default Entity;
