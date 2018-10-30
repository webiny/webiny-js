import { Entity } from "webiny-entity";

class UserDynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("groupsDynamic")
            .entities(GroupDynamic)
            .setUsing(UserDynamicGroupsDynamic)
            .setDynamic(() => [new GroupDynamic(), new GroupDynamic()]);
    }
}

UserDynamic.classId = "UserDynamic";

class GroupDynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

GroupDynamic.classId = "GroupDynamic";

class UserDynamicGroupsDynamic extends Entity {
    constructor() {
        super();
        this.attr("userDynamic").entity(UserDynamic);
        this.attr("groupDynamic").entity(GroupDynamic);
    }
}
UserDynamicGroupsDynamic.classId = "UserDynamicGroupsDynamic";

export { UserDynamic, GroupDynamic, UserDynamicGroupsDynamic };
