import { Entity } from "webiny-api/entities";

export default class User extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

User.classId = "User";
User.storageClassId = "Users";
