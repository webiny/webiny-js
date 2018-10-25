import { Entity } from "webiny-entity";

class ClassADynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classBDynamic").entity(ClassBDynamic);
        this.attr("classBDynamic")
            .entity(ClassBDynamic)
            .setDynamic(() => null);
    }
}

ClassADynamic.classId = "ClassADynamic";

class ClassBDynamic extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("classCDynamic").entity(ClassCDynamic);
        this.attr("classCDynamic")
            .entity(ClassCDynamic)
            .setDynamic(() => null);
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
