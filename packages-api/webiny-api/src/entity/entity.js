// @flow
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {
    constructor() {
        super();
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

export default Entity;
