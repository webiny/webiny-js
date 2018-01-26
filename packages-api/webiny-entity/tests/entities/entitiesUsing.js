import { Entity } from "./../../src";

class User extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("groups")
            .entities(Group)
            .setUsing(UsersGroups);
    }
}

class Group extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

class UsersGroups extends Entity {
    constructor() {
        super();
        this.attr("user").entity(User);
        this.attr("group").entity(Group);
    }
}

export { User, Group, UsersGroups };
