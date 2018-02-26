// @flow
import api from "webiny-api";
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {
    constructor() {
        super();

        api.apps.map(app => {
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
