import { Entity } from "../../src";

export default class User extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

User.classId = "User";
User.storageClassId = "Users";
