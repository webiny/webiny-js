// @flow
import { app } from "webiny-api";
import { Entity as BaseEntity } from "webiny-entity";
import RequestEntityPool from "./RequestEntityPool";

class Entity extends BaseEntity {
    constructor() {
        super();
        app.entities.applyExtensions(this);
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

Entity.pool = new RequestEntityPool();
export default Entity;
