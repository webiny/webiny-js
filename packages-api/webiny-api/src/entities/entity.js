// @flow
import { app } from "webiny-api";
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {
    constructor() {
        super();

        app.apps.map(app => {
            app.applyEntityExtensions(this);
        });
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

export default Entity;
