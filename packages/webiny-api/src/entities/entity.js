// @flow
import { app } from "webiny-api";
import { Entity as BaseEntity } from "webiny-entity";
import RequestEntityPool from "./RequestEntityPool";
class Entity extends BaseEntity {
    constructor() {
        super();
        app.entities.applyExtensions(this);

        this.attr("ownerClassId")
            .char()
            .setProtected();
        this.attr("owner")
            .identity({ classIdAttribute: "ownerClassId" })
            .setProtected();
        this.attr("groups")
            .entities(Group)
            .setToStorage()
            .setProtected();
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

Entity.pool = new RequestEntityPool();

class Group extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("description")
            .char()
            .setValidators("required");
        this.attr("permissions")
            .object()
            .setValidators()
            .setValue({ entities: {}, api: {} });
    }
}

Group.classId = "SecurityGroup";
Group.tableName = "Security_Groups";

export { Group };
export default Entity;
