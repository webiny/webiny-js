import { Entity } from "webiny-entity";

class Main extends Entity {
    constructor() {
        super();
        this.attr("assignedTo").entity([A, B, C], { classIdAttribute: "assignedToClassId" });
        this.attr("assignedToClassId").char();
    }
}

class MainMissingClassIdAttributeOption extends Entity {
    constructor() {
        super();
        this.attr("assignedTo").entity([A, B, C]);
    }
}
MainMissingClassIdAttributeOption.classId = "MainMissingClassIdAttributeOption";

class MainMissingClassIdAttribute extends Entity {
    constructor() {
        super();
        this.attr("assignedTo").entity([A, B, C], { classIdAttribute: "assignedToClassId" });
        this.attr("assignedToClassIdEdited").char();
    }
}
MainMissingClassIdAttribute.classId = "MainMissingClassIdAttribute";

Main.classId = "Issue";

class A extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

A.classId = "A";

class B extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

B.classId = "B";

class C extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

C.classId = "C";

class InvalidEntityClass extends Entity {
    constructor() {
        super();
    }
}
InvalidEntityClass.classId = "InvalidEntityClass";

export {
    Main,
    MainMissingClassIdAttributeOption,
    MainMissingClassIdAttribute,
    InvalidEntityClass,
    A,
    B,
    C
};
