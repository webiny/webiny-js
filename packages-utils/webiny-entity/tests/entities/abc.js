import { Entity } from "./../../lib";

class ClassA extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classB").entity(ClassB);
    }
}

class ClassB extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classC").entity(ClassC);
    }
}

class ClassC extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

export { ClassA, ClassB, ClassC };
