import MongoDbDriver from "./../..";
import { database } from "./../database";
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {}

Entity.driver = new MongoDbDriver({
    database
});

export default Entity;
