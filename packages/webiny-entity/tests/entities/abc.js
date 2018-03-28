import { Entity } from "./../../src";

class ClassA extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classB").entity(ClassB);
    }
}

ClassA.classId = "ClassA";

class ClassB extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classC").entity(ClassC);
    }
}

ClassB.classId = "ClassB";

class ClassC extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

ClassC.classId = "ClassC";

export { ClassA, ClassB, ClassC };
