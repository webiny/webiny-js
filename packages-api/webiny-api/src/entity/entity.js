// @flow
import {Entity as BaseEntity} from 'webiny-entity';

class Entity extends BaseEntity {
    constructor() {
        super();

        // this.attr('createdOn').date().setDefaultValue('now')
    }
}

export default Entity;