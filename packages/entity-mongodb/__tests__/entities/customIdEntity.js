import { Entity } from "@webiny/entity";
import MongoDbDriver from "../..";
import { database } from "./../database";

class CustomIdEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

CustomIdEntity.driver = new MongoDbDriver({
    database
});

export default CustomIdEntity;
