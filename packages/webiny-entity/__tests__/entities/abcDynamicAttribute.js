import { Entity } from "webiny-entity";

class ClassADynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classBDynamic").entity(ClassBDynamic);
    }
}

ClassADynamic.classId = "ClassADynamic";

class ClassBDynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classCDynamic").entity(ClassCDynamic);
    }
}

ClassBDynamic.classId = "ClassBDynamic";

class ClassCDynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

ClassCDynamic.classId = "ClassCDynamic";

export { ClassADynamic, ClassBDynamic, ClassCDynamic };
