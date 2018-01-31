// @flow
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {
    constructor() {
        super();
        this.attr("createdOn").date();
        this.attr("modifiedOn").date();
        this.attr("deletedOn").date();
    }
}

Entity.on("onBeforeCreate", entity => {
    entity.createdOn = new Date();
});

Entity.on("onBeforeUpdate", entity => {
    entity.modifiedOn = new Date();
});

Entity.on("onBeforeDelete", entity => {
    entity.deletedOn = new Date();
});

export default Entity;
