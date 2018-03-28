import { Entity as BaseEntity } from "webiny-entity";

import { MemoryDriver } from "./../..";

class Entity extends BaseEntity {}

Entity.driver = new MemoryDriver();

export default Entity;
