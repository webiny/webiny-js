import { Entity } from "./../../src";

class Main extends Entity {
    constructor() {
        super();
        this.attr("assignedTo").entity([A, B, C], { classIdAttribute: "assignedToClassId" });
        this.attr("assignedToClassId").char();
    }
}

class MainMissingClassIdAttribute extends Entity {
    constructor() {
        super();
        this.attr("assignedTo").entity([A, B, C]);
    }
}

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

export { Main, MainMissingClassIdAttribute, A, B, C };
