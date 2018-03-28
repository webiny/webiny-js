import { Entity } from "./../../src";

class User extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("groups")
            .entities(Group)
            .setToStorage()
            .setUsing(UsersGroups);
    }
}

User.classId = "User";

class Group extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

Group.classId = "Group";

class UsersGroups extends Entity {
    constructor() {
        super();
        this.attr("user")
            .entity(User)
            .setToStorage();

        this.attr("group")
            .entity(Group)
            .setToStorage();
    }
}

UsersGroups.classId = "UsersGroups";

export { User, Group, UsersGroups };
